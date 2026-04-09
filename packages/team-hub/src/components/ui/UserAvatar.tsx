interface UserAvatarProps {
  name: string
  color: string
  size?: number
}

export function UserAvatar({ name, color, size = 24 }: UserAvatarProps) {
  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-medium shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.45,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
