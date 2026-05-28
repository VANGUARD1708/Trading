import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAnthropicConversations,
  useCreateAnthropicConversation,
  useGetAnthropicConversation,
  useDeleteAnthropicConversation,
  getListAnthropicConversationsQueryKey,
  getGetAnthropicConversationQueryKey,
} from "@workspace/api-client-react";
import { Plus, Trash2, Send, Bot, User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

export default function Analyst() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversations, isLoading: loadingList } = useListAnthropicConversations();
  const createConv = useCreateAnthropicConversation();
  const deleteConv = useDeleteAnthropicConversation();

  const { data: activeConv, isLoading: loadingConv } = useGetAnthropicConversation(selectedId!, {
    query: {
      enabled: !!selectedId,
      queryKey: getGetAnthropicConversationQueryKey(selectedId!),
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConv?.messages, streamingText]);

  const handleCreate = () => {
    createConv.mutate({ data: { title: "New Analysis" } }, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getListAnthropicConversationsQueryKey() });
        setSelectedId(res.id);
      }
    });
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteConv.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAnthropicConversationsQueryKey() });
        if (selectedId === id) setSelectedId(null);
      }
    });
  };

  const handleSend = async (content: string) => {
    if (!content.trim() || !selectedId) return;
    
    let convId = selectedId;
    setMessage("");
    setIsStreaming(true);
    setStreamingText("");

    // optimistic update could go here
    try {
      const BASE_URL = import.meta.env.BASE_URL;
      const response = await fetch(`${BASE_URL}api/anthropic/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            if (data.done) break;
            if (data.content) {
              setStreamingText(prev => prev + data.content);
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: getGetAnthropicConversationQueryKey(convId) });
    }
  };

  const startWithSample = (question: string) => {
    createConv.mutate({ data: { title: question.slice(0, 30) } }, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getListAnthropicConversationsQueryKey() });
        setSelectedId(res.id);
        setTimeout(() => handleSend(question), 100);
      }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full w-full bg-background rounded-xl overflow-hidden border border-border"
    >
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <Button onClick={handleCreate} className="w-full gap-2" variant="outline" data-testid="button-new-conversation">
            <Plus className="h-4 w-4" /> New Conversation
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {loadingList ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-md" />)
            ) : conversations?.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">No conversations yet</div>
            ) : (
              conversations?.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  data-testid={`conv-${conv.id}`}
                  className={`group flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                    selectedId === conv.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span className="truncate text-sm font-medium">{conv.title || "New Conversation"}</span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, conv.id)}
                    className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col relative bg-background/50">
        {!selectedId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 glow-primary">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">NexusFlow AI Analyst</h2>
            <p className="text-muted-foreground mb-8">
              I can analyze market structures, identify liquidity zones, and reason about macroeconomic events. What would you like to know?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {[
                "What's the outlook for BTC?",
                "Explain the head and shoulders on ETH",
                "What would happen if BTC breaks $68,500?",
                "Give me the market narrative"
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => startWithSample(q)}
                  className="p-4 text-sm text-left border border-border rounded-lg bg-card hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-border bg-card/50 flex items-center">
              <h3 className="font-medium">{activeConv?.title || "Conversation"}</h3>
            </div>
            
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-6"
            >
              {loadingConv ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-3/4 ml-auto" />
                  <Skeleton className="h-24 w-3/4" />
                </div>
              ) : (
                <>
                  {activeConv?.messages?.map((msg, i) => (
                    <div key={i} className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.role === 'user' ? 'bg-primary/20 text-primary' : 'bg-secondary text-secondary-foreground'
                      }`}>
                        {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div className={`p-4 rounded-xl text-sm whitespace-pre-wrap font-mono ${
                        msg.role === 'user' ? 'bg-primary/10 border border-primary/20' : 'bg-card border border-border'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isStreaming && (
                    <div className="flex gap-4 max-w-3xl mr-auto">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-secondary text-secondary-foreground">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="p-4 rounded-xl text-sm whitespace-pre-wrap font-mono bg-card border border-border">
                        {streamingText}
                        <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse align-middle" />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-4 bg-background border-t border-border">
              <div className="max-w-3xl mx-auto relative">
                <Textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask the analyst..."
                  className="min-h-[60px] max-h-[200px] pr-12 resize-none bg-card border-border focus-visible:ring-primary"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(message);
                    }
                  }}
                  disabled={isStreaming}
                />
                <Button 
                  size="icon" 
                  className="absolute right-2 bottom-2 h-8 w-8"
                  disabled={!message.trim() || isStreaming}
                  onClick={() => handleSend(message)}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center mt-2 text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <Bot className="h-3 w-3" /> Powered by GPT-4o · Market data injected into every response
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
