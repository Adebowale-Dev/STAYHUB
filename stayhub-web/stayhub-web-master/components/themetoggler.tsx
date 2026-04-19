"use client";
import { Moon, SunDim } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";
type props = {
    className?: string;
    variant?: "icon-only" | "with-text";
};
export const AnimatedThemeToggler = ({ className, variant = "icon-only", }: props) => {
    const { theme, setTheme } = useTheme();
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    const changeTheme = async () => {
        if (!buttonRef.current)
            return;
        const newTheme = theme === "dark" ? "light" : "dark";
        if (!document.startViewTransition) {
            setTheme(newTheme);
            return;
        }
        await document.startViewTransition(() => {
            flushSync(() => {
                setTheme(newTheme);
            });
        }).ready;
        const { top, left, width, height } = buttonRef.current.getBoundingClientRect();
        const y = top + height / 2;
        const x = left + width / 2;
        const right = window.innerWidth - left;
        const bottom = window.innerHeight - top;
        const maxRad = Math.hypot(Math.max(left, right), Math.max(top, bottom));
        document.documentElement.animate({
            clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${maxRad}px at ${x}px ${y}px)`,
            ],
        }, {
            duration: 700,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
        });
    };
    if (!mounted) {
        return (<button ref={buttonRef} className={cn(variant === "with-text" ? "w-full justify-start gap-2" : "", className)}>
        <Moon className="h-3.5 w-3.5 shrink-0"/>
        {variant === "with-text" && <span>Toggle theme</span>}
      </button>);
    }
    if (variant === "with-text") {
        return (<button ref={buttonRef} type="button" onClick={changeTheme} className={cn("flex items-center gap-2 w-full", className)} aria-label="Toggle theme">
        <SunDim className="h-3.5 w-3.5 shrink-0 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"/>
        <Moon className="absolute h-3.5 w-3.5 shrink-0 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"/>
        <span className="dark:hidden">Light Mode</span>
        <span className="hidden dark:inline">Dark Mode</span>
      </button>);
    }
    return (<button ref={buttonRef} type="button" onClick={changeTheme} className={cn("relative inline-flex items-center justify-center rounded-md border border-input bg-background p-2 transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50", "h-10 w-10", className)} aria-label="Toggle theme">
      <SunDim className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"/>
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"/>
      <span className="sr-only">Toggle theme</span>
    </button>);
};
