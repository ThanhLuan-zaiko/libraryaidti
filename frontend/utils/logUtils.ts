export const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

export const getLabel = (key: string) => {
    const labels: Record<string, string> = {
        'site_name': 'Tên website',
        'site_description': 'Mô tả website',
        'contact_email': 'Email liên hệ',
        'contact_phone': 'Số điện thoại',
        'footer_text': 'Nội dung chân trang',
        'items_per_page': 'Số bài viết mỗi trang',
        'allow_registration': 'Cho phép đăng ký',
        'maintenance_mode': 'Chế độ bảo trì',
        'facebook_url': 'Link Facebook',
        'youtube_url': 'Link Youtube',
        'name': 'Tên',
        'slug': 'Đường dẫn (Slug)',
        'description': 'Mô tả',
        'title': 'Tiêu đề',
        'content': 'Nội dung',
        'thumbnail': 'Ảnh đại diện',
        'category_id': 'ID Danh mục',
        'status': 'Trạng thái',
        'view_count': 'Lượt xem',
        'author': 'Tác giả',
        'images': 'Danh sách ảnh',
        'tags': 'Thẻ (Tags)',
        'updated_at': 'Cập nhật lúc',
        'created_at': 'Tạo lúc'
    };
    return labels[key] || key;
};
