'use client';

import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { AVAILABLE_PLACEHOLDERS } from '@/types/bot-customization';

interface GreetingEditorProps {
  message: string;
  onChange: (message: string) => void;
  disabled?: boolean;
}

const CHARACTER_LIMIT = 300;

export function GreetingEditor({ message, onChange, disabled = false }: GreetingEditorProps) {
  const [charCount, setCharCount] = useState(message.length);

  // Sync charCount with message prop changes (when loaded from API)
  useEffect(() => {
    console.log('[GreetingEditor] Message prop changed:', message.substring(0, 50), 'Length:', message.length);
    setCharCount(message.length);
  }, [message]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    if (newMessage.length <= CHARACTER_LIMIT) {
      onChange(newMessage);
      setCharCount(newMessage.length);
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    if (disabled) return;
    const newMessage = message + ` ${placeholder}`;
    if (newMessage.length <= CHARACTER_LIMIT) {
      onChange(newMessage);
      setCharCount(newMessage.length);
    }
  };

  const getPreviewMessage = () => {
    return message
      .replace(/{prospect_name}/g, 'John Doe')
      .replace(/{property_name}/g, 'Sunset Apartments')
      .replace(/{bot_name}/g, 'Alex');
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This is the first message your bot sends to prospects. Keep it friendly and concise.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="greeting-message" className="text-base font-semibold">
          Message Text
        </Label>
        <Textarea
          id="greeting-message"
          value={message}
          onChange={handleChange}
          disabled={disabled}
          rows={5}
          placeholder="Enter your greeting message..."
          className="resize-none"
        />
        <div className="flex justify-between items-center text-sm">
          <span className={charCount > CHARACTER_LIMIT * 0.9 ? 'text-orange-500 font-medium' : 'text-muted-foreground'}>
            {charCount}/{CHARACTER_LIMIT} characters
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-base font-semibold">Available Placeholders</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Click to insert dynamic values into your message
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_PLACEHOLDERS.map((placeholder) => (
            <Badge
              key={placeholder.value}
              variant="outline"
              className={`cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => insertPlaceholder(placeholder.value)}
              title={placeholder.description}
            >
              {placeholder.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-base font-semibold">Preview</Label>
        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-sm italic">{getPreviewMessage() || 'Your preview will appear here...'}</p>
        </div>
      </div>
    </div>
  );
}
