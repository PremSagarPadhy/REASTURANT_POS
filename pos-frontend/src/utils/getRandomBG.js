export const getRandomBG =() => {
    const colors = [
        'bg-[#E3A008]',
        'bg-[#2563EB]',
        'bg-[#DC2626]',
        'bg-[#10B981]',
    ];
    const color= colors[Math.floor(Math.random() * colors.length)];
    return color;
}