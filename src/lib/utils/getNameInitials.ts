export const getInitials = (name: string) => {
    if (!name) return undefined
    const words = name.split(" ");
    return words.map((word) => word[0]).join("").toUpperCase();
};