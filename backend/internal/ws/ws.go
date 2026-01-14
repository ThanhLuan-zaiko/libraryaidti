package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"backend/internal/session"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// WSAction defines the structure of incoming WebSocket messages
type WSAction struct {
	Action  string `json:"action"`
	Payload string `json:"payload"` // e.g., "article_uuid"
}

type Client struct {
	Hub    *Hub
	UserID uuid.UUID
	Conn   *websocket.Conn
	Send   chan []byte
	Rooms  map[string]bool // Track joined rooms for easy cleanup
}

type Hub struct {
	Clients    map[uuid.UUID][]*Client     // UserID -> Clients
	Rooms      map[string]map[*Client]bool // RoomID -> Set of Clients
	Broadcast  chan []byte
	Register   chan *Client
	Unregister chan *Client
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		Broadcast:  make(chan []byte, 100),
		Register:   make(chan *Client, 100),
		Unregister: make(chan *Client, 100),
		Clients:    make(map[uuid.UUID][]*Client),
		Rooms:      make(map[string]map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			// Register User
			h.Clients[client.UserID] = append(h.Clients[client.UserID], client)
			isFirstConnection := len(h.Clients[client.UserID]) == 1

			// Initialize client rooms
			client.Rooms = make(map[string]bool)

			// Get list of all currently online user IDs
			onlineUserIDs := make([]uuid.UUID, 0, len(h.Clients))
			for id := range h.Clients {
				onlineUserIDs = append(onlineUserIDs, id)
			}
			h.mu.Unlock()

			// Send initial list to the new client
			h.sendOnlineList(client, onlineUserIDs)

			if isFirstConnection {
				h.broadcastStatus(client.UserID, "online")
			}
		case client := <-h.Unregister:
			h.mu.Lock()
			// Remove from Clients map
			if clients, ok := h.Clients[client.UserID]; ok {
				for i, c := range clients {
					if c == client {
						h.Clients[client.UserID] = append(clients[:i], clients[i+1:]...)
						break
					}
				}
				if len(h.Clients[client.UserID]) == 0 {
					delete(h.Clients, client.UserID)
					h.mu.Unlock()
					h.broadcastStatus(client.UserID, "offline")
					h.mu.Lock()
				}
			}

			// Remove from all Rooms
			for roomID := range client.Rooms {
				if clientsInRoom, ok := h.Rooms[roomID]; ok {
					delete(clientsInRoom, client)
					if len(clientsInRoom) == 0 {
						delete(h.Rooms, roomID)
					}
				}
			}
			h.mu.Unlock()
			close(client.Send) // Close channel here

		case message := <-h.Broadcast:
			// General broadcast (system-wide)
			h.mu.RLock()
			for _, clients := range h.Clients {
				for _, client := range clients {
					select {
					case client.Send <- message:
					default:
						// Queue full, maybe close? For now ignore.
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) Subscribe(client *Client, roomID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.Rooms[roomID]; !ok {
		h.Rooms[roomID] = make(map[*Client]bool)
	}
	h.Rooms[roomID][client] = true
	client.Rooms[roomID] = true
	log.Printf("Client %s joined room %s", client.UserID, roomID)
}

func (h *Hub) Unsubscribe(client *Client, roomID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if clients, ok := h.Rooms[roomID]; ok {
		delete(clients, client)
		if len(clients) == 0 {
			delete(h.Rooms, roomID)
		}
	}
	delete(client.Rooms, roomID)
	log.Printf("Client %s left room %s", client.UserID, roomID)
}

func (h *Hub) BroadcastToRoom(roomID string, msgType string, payload interface{}) {
	data, err := json.Marshal(map[string]interface{}{
		"type":    msgType,
		"payload": payload,
	})
	if err != nil {
		log.Printf("Error marshaling room message: %v", err)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	if clients, ok := h.Rooms[roomID]; ok {
		for client := range clients {
			select {
			case client.Send <- data:
			default:
				log.Printf("Failed to send to client in room %s", roomID)
			}
		}
	}
}

func (h *Hub) broadcastStatus(userID uuid.UUID, status string) {
	go func() {
		data, err := json.Marshal(map[string]interface{}{
			"type": "user_status",
			"payload": map[string]interface{}{
				"user_id": userID,
				"status":  status,
			},
		})
		if err != nil {
			log.Printf("Error marshaling status message: %v", err)
			return
		}
		h.Broadcast <- data
	}()
}

func (h *Hub) sendOnlineList(client *Client, userIDs []uuid.UUID) {
	data, err := json.Marshal(map[string]interface{}{
		"type": "online_list",
		"payload": map[string]interface{}{
			"user_ids": userIDs,
		},
	})
	if err != nil {
		log.Printf("Error marshaling online list message: %v", err)
		return
	}
	select {
	case client.Send <- data:
	default:
		log.Printf("Failed to send online list to client %s", client.UserID)
	}
}

func (h *Hub) SendToUser(userID uuid.UUID, msgType string, payload interface{}) {
	data, err := json.Marshal(map[string]interface{}{
		"type":    msgType,
		"payload": payload,
	})
	if err != nil {
		log.Printf("Error marshaling WS message: %v", err)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	if clients, ok := h.Clients[userID]; ok {
		for _, client := range clients {
			select {
			case client.Send <- data:
			default:
				log.Printf("Failed to send message to user %s", userID)
			}
		}
	}
}

func (h *Hub) BroadcastEvent(msgType string, payload interface{}) {
	data, err := json.Marshal(map[string]interface{}{
		"type":    msgType,
		"payload": payload,
	})
	if err != nil {
		log.Printf("Error marshaling broadcast message: %v", err)
		return
	}
	h.Broadcast <- data
}

func (c *Client) readPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()
	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error { c.Conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		// Handle JSON messages
		var action WSAction
		if err := json.Unmarshal(message, &action); err == nil {
			switch action.Action {
			case "join_room":
				c.Hub.Subscribe(c, action.Payload)
			case "leave_room":
				c.Hub.Unsubscribe(c, action.Payload)
			}
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func ServeWs(hub *Hub, c *gin.Context) {
	userIDInterface := session.SessionManager.Get(c.Request.Context(), "user_id")
	var userID uuid.UUID

	if userIDInterface == nil {
		// Allow guest connection
		userID = uuid.New()
	} else {
		var ok bool
		userID, ok = userIDInterface.(uuid.UUID)
		if !ok {
			if idStr, ok := userIDInterface.(string); ok {
				var err error
				userID, err = uuid.Parse(idStr)
				if err != nil {
					// Fallback to guest if parsing fails? Or error?
					// Let's error for safety if session exists but is invalid
					c.JSON(http.StatusBadRequest, gin.H{"error": "ID người dùng không hợp lệ"})
					return
				}
			} else {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Định dạng ID người dùng không hợp lệ"})
				return
			}
		}
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println(err)
		return
	}
	client := &Client{Hub: hub, UserID: userID, Conn: conn, Send: make(chan []byte, 256)}
	client.Hub.Register <- client

	go client.writePump()
	go client.readPump()
}
