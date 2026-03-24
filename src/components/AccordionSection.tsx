import { useState, useRef, useEffect, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  accentColor?: string;
}

export default function AccordionSection({
  title,
  icon,
  children,
  defaultOpen = false,
  accentColor = 'var(--accent)',
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<string>(defaultOpen ? '2000px' : '0px');

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setMaxHeight(`${contentRef.current.scrollHeight + 40}px`);
    } else {
      setMaxHeight('0px');
    }
  }, [isOpen]);

  return (
    <div className="accordion-section">
      <button
        className="accordion-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span style={{ color: accentColor, display: 'flex', alignItems: 'center' }}>
          {icon}
        </span>
        <span>{title}</span>
        <ChevronDown size={16} className="accordion-icon" />
      </button>
      <div
        className="accordion-content"
        data-open={isOpen ? 'true' : 'false'}
        style={{ maxHeight }}
        ref={contentRef}
      >
        <div className="accordion-body">
          {children}
        </div>
      </div>
    </div>
  );
}
