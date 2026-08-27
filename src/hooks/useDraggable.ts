import { useState, useCallback, useEffect, RefObject, useRef } from 'react';

export interface Position {
  x: number;
  y: number;
}

export interface UseDraggableOptions {
  /** Initial position of the draggable element */
  initialPosition: Position;
  /** Reference to the draggable element for bounds calculation */
  elementRef: RefObject<HTMLElement | null>;
  /** Optional bounds constraint (defaults to viewport) */
  bounds?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

export interface UseDraggableReturn {
  /** Current position of the element */
  position: Position;
  /** Whether the element is currently being dragged */
  isDragging: boolean;
  /** Mouse down handler to attach to the drag handle */
  handleMouseDown: (e: React.MouseEvent) => void;
  /** Reset position to initial values */
  resetPosition: () => void;
  /** Reset position to a new position and update initial position */
  resetToPosition: (newPosition: Position) => void;
}

/**
 * Custom hook for making elements draggable within bounds.
 * Handles mouse events and constrains movement to viewport or custom bounds.
 */
export function useDraggable({
  initialPosition,
  elementRef,
  bounds,
}: UseDraggableOptions): UseDraggableReturn {
  // Store initial position in a ref to avoid re-renders when the object reference changes
  const initialPositionRef = useRef<Position>(initialPosition);
  
  const [position, setPosition] = useState<Position>(() => initialPositionRef.current);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

  const constrainPosition = useCallback(
    (x: number, y: number): Position => {
      const element = elementRef.current;
      if (!element) {
        return { x, y };
      }

      const rect = element.getBoundingClientRect();
      const elementWidth = rect.width;
      const elementHeight = rect.height;

      // Use custom bounds or viewport bounds
      const effectiveBounds = bounds || {
        left: 0,
        top: 0,
        right: window.innerWidth,
        bottom: window.innerHeight,
      };

      // Constrain position so element stays within bounds
      const constrainedX = Math.max(
        effectiveBounds.left,
        Math.min(x, effectiveBounds.right - elementWidth)
      );
      const constrainedY = Math.max(
        effectiveBounds.top,
        Math.min(y, effectiveBounds.bottom - elementHeight)
      );

      return { x: constrainedX, y: constrainedY };
    },
    [bounds, elementRef]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only handle left mouse button
      if (e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();

      const element = elementRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      
      // Calculate offset from mouse position to element's top-left corner
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });

      setIsDragging(true);
    },
    [elementRef]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      e.preventDefault();

      // Calculate new position based on mouse position minus the initial offset
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      const constrained = constrainPosition(newX, newY);
      setPosition(constrained);
    },
    [isDragging, dragOffset, constrainPosition]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetPosition = useCallback(() => {
    setPosition(initialPositionRef.current);
  }, []);

  const resetToPosition = useCallback((newPosition: Position) => {
    initialPositionRef.current = newPosition;
    setPosition(newPosition);
  }, []);

  // Add/remove global mouse event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Re-constrain position when the element's size changes (e.g. content/tab switch)
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new ResizeObserver(() => {
      setPosition((prev) => constrainPosition(prev.x, prev.y));
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, constrainPosition]);

  // Handle window resize to keep element in bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => constrainPosition(prev.x, prev.y));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [constrainPosition]);

  return {
    position,
    isDragging,
    handleMouseDown,
    resetPosition,
    resetToPosition,
  };
}

export default useDraggable;
