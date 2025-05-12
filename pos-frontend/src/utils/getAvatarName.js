export const getAvatarName=(name)=> {
    if(!name) return "";
    return name.split(" ").map(word => word[0]).join("").toUpperCase();
}