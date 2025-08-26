import * as React from "react"

import { cn } from "@/lib/utils"
import { Eye, EyeOff } from "lucide-react"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const [show, setShow] = React.useState(false)
    const isPassword = type === "password"
    const inputType = isPassword && show ? "text" : type

    return (
      <div
        className={cn("flex  rounded-md  bg-transparent  text-base shadow-sm ", className, isPassword ? "pr-10" : "")}
        style={{ position: isPassword ? "relative" : undefined }}
      >
        <input
          className={cn(
            "h-9 w-full px-3 py-1",
            "transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "border border-input rounded-md bg-transparent"
          )}
          type={inputType}
          ref={ref}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((v: boolean) => !v)}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              padding: 0,
              margin: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#888",
            }}
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
