
import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  initialRating?: number;
  totalStars?: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StarRating({
  initialRating = 0,
  totalStars = 5,
  onChange,
  readonly = false,
  size = "md"
}: StarRatingProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-7 h-7"
  };

  const handleClick = (index: number) => {
    if (readonly) return;
    const newRating = index + 1;
    setRating(newRating);
    onChange?.(newRating);
  };

  const handleMouseEnter = (index: number) => {
    if (readonly) return;
    setHoverRating(index + 1);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHoverRating(0);
  };

  return (
    <div className="flex items-center">
      {[...Array(totalStars)].map((_, index) => {
        const isActive = (hoverRating || rating) > index;
        
        return (
          <Star
            key={index}
            className={cn(
              sizeClasses[size],
              "transition-all duration-150 cursor-pointer mr-0.5",
              isActive ? "fill-yellow-400 text-yellow-400" : "text-gray-300",
              readonly ? "cursor-default" : ""
            )}
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          />
        );
      })}
    </div>
  );
}
