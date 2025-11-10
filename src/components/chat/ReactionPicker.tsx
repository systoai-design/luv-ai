import { motion, AnimatePresence } from 'framer-motion';

interface ReactionPickerProps {
  isOpen: boolean;
  onSelect: (emoji: string) => void;
  position: { x: number; y: number };
}

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢'];

export const ReactionPicker = ({ isOpen, onSelect, position }: ReactionPickerProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          className="fixed z-50 bg-background border border-border rounded-full shadow-lg px-2 py-2 flex gap-2"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -100%) translateY(-8px)',
          }}
        >
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="text-2xl hover:scale-125 transition-transform active:scale-110 w-10 h-10 flex items-center justify-center"
            >
              {emoji}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
