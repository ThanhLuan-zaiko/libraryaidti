export interface NavLink {
    name: string;
    href: string;
    dropdown?: NavLink[];
}
