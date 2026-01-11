'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarCheck, XCircle, Info } from 'lucide-react';
import { AVAILABLE_PLACEHOLDERS } from '@/types/bot-customization';
import { Separator } from '@/components/ui/separator';

interface SchedulingMessagesEditorProps {
  tourConfirmation: string;
  notQualified: string;
  onTourConfirmationChange: (message: string) => void;
  onNotQualifiedChange: (message: string) => void;
  disabled?: boolean;
}

const CHARACTER_LIMIT = 300;

export function SchedulingMessagesEditor({
  tourConfirmation,
  notQualified,
  onTourConfirmationChange,
  onNotQualifiedChange,
  disabled = false,
}: SchedulingMessagesEditorProps) {
  const [tourCharCount, setTourCharCount] = useState(tourConfirmation.length);
  const [notQualifiedCharCount, setNotQualifiedCharCount] = useState(notQualified.length);

  const handleTourChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    if (newMessage.length <= CHARACTER_LIMIT) {
      onTourConfirmationChange(newMessage);
      setTourCharCount(newMessage.length);
    }
  };

  const handleNotQualifiedChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    if (newMessage.length <= CHARACTER_LIMIT) {
      onNotQualifiedChange(newMessage);
      setNotQualifiedCharCount(newMessage.length);
    }
  };

  const insertPlaceholder = (placeholder: string, field: 'tour' | 'notQualified') => {
    if (disabled) return;
    if (field === 'tour') {
      const newMessage = tourConfirmation + ` ${placeholder}`;
      if (newMessage.length <= CHARACTER_LIMIT) {
        onTourConfirmationChange(newMessage);
        setTourCharCount(newMessage.length);
      }
    } else {
      const newMessage = notQualified + ` ${placeholder}`;
      if (newMessage.length <= CHARACTER_LIMIT) {
        onNotQualifiedChange(newMessage);
        setNotQualifiedCharCount(newMessage.length);
      }
    }
  };

  const getTourPreview = () => {
    return tourConfirmation
      .replace(/{prospect_name}/g, 'John Doe')
      .replace(/{property_name}/g, 'Sunset Apartments')
      .replace(/{tour_date}/g, 'October 26, 2024')
      .replace(/{tour_time}/g, '2:00 PM');
  };

  const getNotQualifiedPreview = () => {
    return notQualified
      .replace(/{prospect_name}/g, 'John Doe')
      .replace(/{property_name}/g, 'Sunset Apartments');
  };

  return (
    <div className="space-y-10">
      {/* Tour Confirmation Message */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100">
            <CalendarCheck className="h-5 w-5 text-green-700" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Tour Confirmation Message</h3>
            <p className="text-sm text-muted-foreground">
              Sent when a prospect successfully books a tour
            </p>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This message confirms the tour booking and provides appointment details to the prospect.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="tour-confirmation" className="text-base font-semibold">
            Message Text
          </Label>
          <Textarea
            id="tour-confirmation"
            value={tourConfirmation}
            onChange={handleTourChange}
            disabled={disabled}
            rows={5}
            placeholder="Enter tour confirmation message..."
            className="resize-none"
          />
          <div className="flex justify-between items-center text-sm">
            <span className={tourCharCount > CHARACTER_LIMIT * 0.9 ? 'text-orange-500 font-medium' : 'text-muted-foreground'}>
              {tourCharCount}/{CHARACTER_LIMIT} characters
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-base font-semibold">Available Placeholders</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Click to insert dynamic values
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
                onClick={() => insertPlaceholder(placeholder.value, 'tour')}
                title={placeholder.description}
              >
                {placeholder.label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold">Preview</Label>
          <div className="p-4 border rounded-lg bg-green-50 border-green-200">
            <p className="text-sm italic">{getTourPreview() || 'Your preview will appear here...'}</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Not Qualified Message */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100">
            <XCircle className="h-5 w-5 text-orange-700" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Not Qualified Message</h3>
            <p className="text-sm text-muted-foreground">
              Sent when a prospect doesn't meet qualification criteria
            </p>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Keep this message polite and professional. Consider offering alternatives or future contact options.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="not-qualified" className="text-base font-semibold">
            Message Text
          </Label>
          <Textarea
            id="not-qualified"
            value={notQualified}
            onChange={handleNotQualifiedChange}
            disabled={disabled}
            rows={5}
            placeholder="Enter not qualified message..."
            className="resize-none"
          />
          <div className="flex justify-between items-center text-sm">
            <span className={notQualifiedCharCount > CHARACTER_LIMIT * 0.9 ? 'text-orange-500 font-medium' : 'text-muted-foreground'}>
              {notQualifiedCharCount}/{CHARACTER_LIMIT} characters
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-base font-semibold">Available Placeholders</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Click to insert dynamic values
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_PLACEHOLDERS.filter(p => 
              ['prospect_name', 'property_name'].some(v => p.value.includes(v))
            ).map((placeholder) => (
              <Badge
                key={placeholder.value}
                variant="outline"
                className={`cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors ${
                  disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => insertPlaceholder(placeholder.value, 'notQualified')}
                title={placeholder.description}
              >
                {placeholder.label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold">Preview</Label>
          <div className="p-4 border rounded-lg bg-orange-50 border-orange-200">
            <p className="text-sm italic">{getNotQualifiedPreview() || 'Your preview will appear here...'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
