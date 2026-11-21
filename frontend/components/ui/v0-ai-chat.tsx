"use client";

import { useEffect, useRef, useCallback } from "react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { callBackend } from "@/src/bridge";
import {
    ImageIcon,
    FileUp,
    MonitorIcon,
    CircleUserRound,
    ArrowUpIcon,
    Paperclip,
    PlusIcon,
} from "lucide-react";

function FigmaIcon({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"/>
            <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"/>
            <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z"/>
            <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z"/>
            <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"/>
        </svg>
    );
}

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            // Temporarily shrink to get the right scrollHeight
            textarea.style.height = `${minHeight}px`;

            // Calculate new height
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        // Set initial height
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    // Adjust height on window resize
    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

type ChatMessage = { role: "you" | "audit"; text: string; images?: string[] }
type PageJump = "docs" | "files" | "errors" | "tracker" | "dashboard" | "ai"

function mentorReply(userText: string) {
    const body = userText.trim().slice(0, 1200)
    return [
        "Here is the edit to type. I do not save the file. You apply it in Workspace.",
        "",
        "```text",
        body,
        "```",
        "",
        "Open the matching page in Docs, type the change in the open file, then Save.",
    ].join("\n")
}

function splitBlocks(text: string) {
    const blocks: Array<{ type: "text" | "code"; lang: string; body: string }> = []
    const re = /```(\w*)\n?([\s\S]*?)```/g
    let last = 0
    let match: RegExpExecArray | null
    while ((match = re.exec(text))) {
        if (match.index > last) blocks.push({ type: "text", lang: "", body: text.slice(last, match.index) })
        blocks.push({ type: "code", lang: match[1] || "text", body: match[2].replace(/\n$/, "") })
        last = match.index + match[0].length
    }
    if (last < text.length) blocks.push({ type: "text", lang: "", body: text.slice(last) })
    return blocks
}

function MessageBody({ text }: { text: string }) {
    return (
        <div className="space-y-3">
            {splitBlocks(text).map((block, index) =>
                block.type === "code" ? (
                    <div key={index} className="overflow-hidden rounded-xl border border-white/10 bg-[#1e1e1e]">
                        <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-white/50">
                            <span>{block.lang}</span>
                            <button
                                type="button"
                                className="rounded-full px-2 py-0.5 hover:bg-white/10 hover:text-white"
                                onClick={() => { void navigator.clipboard.writeText(block.body) }}
                            >
                                Copy
                            </button>
                        </div>
                        <pre className="overflow-x-auto px-3 pb-3 text-[13px] leading-6 text-[#d4d4d4]"><code>{block.body}</code></pre>
                    </div>
                ) : (
                    <p key={index} className="whitespace-pre-wrap text-[15px] leading-7 text-[#e6e6e6]">{block.body.trim()}</p>
                )
            )}
        </div>
    )
}

export function VercelV0Chat({
    hint = "this project",
    projectName = "",
    onNavigate,
    variant = "screen",
    onClose,
}: {
    hint?: string
    projectName?: string
    onNavigate?: (page: PageJump) => void
    variant?: "screen" | "ask"
    onClose?: () => void
}) {
    const [value, setValue] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [images, setImages] = useState<string[]>([])
    const [chats, setChats] = useState<string[]>([])
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 44,
        maxHeight: 280,
    });
    const [composerHeight, setComposerHeight] = useState(44)

    const fileTask = async (text: string, attached: string[] = []) => {
        const title = text.slice(0, 140)
        const about = projectName ? `Project: ${projectName}\n` : ""
        setMessages((current) => [
            ...current,
            { role: "you", text, images: attached },
            {
                role: "audit",
                text: mentorReply(about + text),
            },
        ])
        setImages([])
        await callBackend("tasks_add", {
            title,
            detail: "You write this. The audit chat does not write code.",
            source: "ai_chat",
        })
        await callBackend("audit_log", {
            toolName: "rule_of_thumb_chat",
            action: "task_filed",
            notes: title,
        })
        window.dispatchEvent(new Event("rule-of-thumb-tasks"))
    }

    useEffect(() => {
        const onAsk = (event: Event) => {
            const text = (event as CustomEvent<string>).detail
            if (text) void fileTask(text)
        }
        window.addEventListener("rule-of-thumb-ask", onAsk)
        return () => window.removeEventListener("rule-of-thumb-ask", onAsk)
    }, [])

    const send = () => {
        const text = value.trim()
        if (!text && images.length === 0) return
        const attached = images
        setValue("")
        adjustHeight(true)
        setChats((current) => [text.slice(0, 42) || "Image", ...current].slice(0, 8))
        void fileTask(text || "Look at the attached image.", attached)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send()
        }
    };

    const screen = variant === "screen"

    return (
        <div className={cn("flex h-full min-h-0 flex-1 flex-col", screen ? "bg-transparent" : "bg-transparent")}>
            {!screen && (
                <div className="flex items-center justify-between px-4 pb-1 pt-3">
                    <div>
                        <div className="text-sm text-white">Ask</div>
                        <div className="text-[11px] text-white/45">About {hint}</div>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-xs text-white/70 hover:bg-white/10">
                        Close
                    </button>
                </div>
            )}
            <div className={cn("min-h-0 flex-1 overflow-y-auto", screen ? "px-6 py-6" : "px-4 py-3")}>
                <div className={cn("mx-auto flex w-full flex-col gap-6", screen ? "max-w-3xl" : "max-w-none")}>
                    {messages.length === 0 && (
                        <p className="pt-8 text-[15px] leading-7 text-white/45">
                            Ask about the open page. The reply is a code block you type into the file.
                        </p>
                    )}
                    {messages.map((message, index) => (
                        message.role === "you" ? (
                            <div key={index} className="flex justify-end">
                                <div className="max-w-[80%] rounded-2xl bg-white/10 px-4 py-2.5 text-[15px] leading-7 text-white">
                                    {message.images?.map((src) => (
                                        <img key={src.slice(0, 32)} src={src} alt="" className="mb-2 max-h-40 rounded-xl" />
                                    ))}
                                    <p className="whitespace-pre-wrap">{message.text}</p>
                                </div>
                            </div>
                        ) : (
                            <div key={index} className="text-left">
                                <div className="mb-2 text-[11px] text-white/40">Mentor</div>
                                <MessageBody text={message.text} />
                            </div>
                        )
                    ))}
                </div>
            </div>
            <div className={cn("mx-auto w-full", screen ? "max-w-3xl px-6 pb-5" : "px-3 pb-3")}>
                <div
                    role="separator"
                    aria-label="Resize the composer"
                    className="mx-auto mb-2 h-1.5 w-16 cursor-ns-resize rounded-full bg-white/20"
                    onMouseDown={(event) => {
                        event.preventDefault()
                        const startY = event.clientY
                        const startH = composerHeight
                        const move = (ev: MouseEvent) => {
                            const next = Math.min(280, Math.max(44, startH + (startY - ev.clientY)))
                            setComposerHeight(next)
                            if (textareaRef.current) textareaRef.current.style.height = `${next}px`
                        }
                        const up = () => {
                            window.removeEventListener("mousemove", move)
                            window.removeEventListener("mouseup", up)
                        }
                        window.addEventListener("mousemove", move)
                        window.addEventListener("mouseup", up)
                    }}
                />
                {variant === "screen" && (
                    <div className="mb-2 flex gap-2 overflow-x-auto">
                        <button type="button" onClick={() => { setMessages([]); setValue("") }} className="rounded-full bg-[#8eb7ff] px-3 py-1 text-[11px] text-black">New chat</button>
                        {chats.map((title, index) => (
                            <span key={`${title}-${index}`} className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/70">{title}</span>
                        ))}
                    </div>
                )}
                {images.length > 0 && (
                    <div className="mb-2 flex gap-2">
                        {images.map((src) => <img key={src.slice(0, 24)} src={src} alt="" className="h-12 w-12 rounded-xl object-cover" />)}
                    </div>
                )}
                {onNavigate && (
                    <div className="mb-2 flex gap-2">
                        <button type="button" onClick={() => onNavigate("docs")} className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/80">Docs</button>
                        <button type="button" onClick={() => onNavigate("files")} className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/80">Workspace</button>
                        <button type="button" onClick={() => onNavigate("errors")} className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/80">Errors</button>
                    </div>
                )}
                <form
                    className="flex items-end gap-2 rounded-3xl border border-white/15 bg-white/10 p-2 shadow-lg backdrop-blur-xl"
                    onSubmit={(event) => { event.preventDefault(); send() }}
                >
                    <label className="mb-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/60 hover:bg-white/10">
                        <Paperclip className="h-4 w-4" />
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0]
                                if (!file) return
                                const reader = new FileReader()
                                reader.onload = () => setImages((current) => [...current, String(reader.result)])
                                reader.readAsDataURL(file)
                                event.target.value = ""
                            }}
                        />
                    </label>
                    <Textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value);
                            adjustHeight();
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={projectName ? `Ask about ${projectName}` : `Ask about ${hint}`}
                        rows={1}
                        className={cn(
                            "max-h-[280px] flex-1 resize-none rounded-2xl border-0 bg-transparent px-3 py-2.5 text-[15px] leading-6 text-white",
                            "focus-visible:ring-0 focus-visible:ring-offset-0",
                            "placeholder:text-white/35"
                        )}
                    />
                    <button
                        type="submit"
                        aria-label="Send"
                        className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ec3750] text-white"
                    >
                        <ArrowUpIcon className="h-4 w-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}

interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
}

function ActionButton({ icon, label, onClick }: ActionButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 rounded-full border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
        >
            {icon}
            <span className="text-xs">{label}</span>
        </button>
    );
}
