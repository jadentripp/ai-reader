import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX, Volume1, ChevronUp, RotateCcw, ListOrdered } from "lucide-react";
import { useTTS } from "@/lib/hooks/useTTS";
import { cn } from "@/lib/utils";

interface TTSPanelProps {
  className?: string;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
type PlaybackSpeed = typeof SPEED_OPTIONS[number];

const getSpeedLabel = (speed: PlaybackSpeed): string => `${speed}x`;

const VolumeIcon = ({ volume }: { volume: number }) => {
  if (volume === 0) return <VolumeX className="h-4 w-4" />;
  if (volume < 0.5) return <Volume1 className="h-4 w-4" />;
  return <Volume2 className="h-4 w-4" />;
};

export function TTSPanel({ className }: TTSPanelProps) {
  const {
    state,
    progress,
    playCurrentPage,
    pause,
    resume,
    setPlaybackRate,
    setVolume,
    seek,
  } = useTTS({
    getDoc: () => null,
    getPageMetrics: () => ({ 
      pageWidth: 0, 
      gap: 0, 
      stride: 0, 
      scrollLeft: 0, 
      rootRect: { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, toJSON: () => "" } as DOMRect 
    }),
    currentPage: 0,
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [playbackRate, setPlaybackRateLocal] = useState<PlaybackSpeed>(1);
  const [volume, setVolumeLocal] = useState(1);
  const [showSpeedSelector, setShowSpeedSelector] = useState(false);

  const touchStartY = useRef<number>(0);
  const touchStartExpanded = useRef<boolean>(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    touchStartY.current = e.clientY;
    touchStartExpanded.current = isExpanded;
  }, [isExpanded]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!touchStartExpanded.current) return;
    
    const deltaY = e.clientY - touchStartY.current;
    
    if (deltaY > 50) {
      setIsExpanded(false);
      touchStartY.current = 0;
      touchStartExpanded.current = false;
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    touchStartY.current = 0;
    touchStartExpanded.current = false;
  }, []);

  const isPlaying = state === "playing";
  const isPaused = state === "paused";
  const currentVoiceName = "Voice 1";

  const handleTogglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      playCurrentPage();
    }
  };

  const handleSpeedSelect = (speed: PlaybackSpeed) => {
    setPlaybackRateLocal(speed);
    setPlaybackRate(speed);
    setShowSpeedSelector(false);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolumeLocal(newVolume);
    setVolume(newVolume);
  };

  const handleSkipBackward = () => {
    const skipAmount = 15;
    const newTime = Math.max(0, progress.currentTime - skipAmount);
    seek(newTime);
  };

  const handleSkipForward = () => {
    const skipAmount = 15;
    const newTime = progress.currentTime + skipAmount;
    
    if (newTime >= progress.duration) {
      seek(progress.duration);
    } else {
      seek(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = progress.duration > 0 
    ? (progress.currentTime / progress.duration) * 100 
    : 0;

  return (
    <div
      data-testid="tts-panel-container"
      onClick={() => !isExpanded && setIsExpanded(true)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/80 backdrop-blur-xl border-t border-border/50",
        "shadow-lg transition-all duration-300 ease-out",
        "animate-in slide-in-from-bottom-0",
        "touch-none",
        isExpanded ? "h-auto pb-4" : "h-16",
        className
      )}
    >
      {/* Progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted">
        <div 
          data-testid="tts-progress-fill"
          className="h-full bg-primary transition-all duration-100"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Mini-player (collapsed state) */}
      <div className={cn(
        "flex items-center gap-3 px-4 h-16",
        isExpanded && "border-b border-border/30"
      )}>
        {/* Play/Pause button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleTogglePlayPause();
          }}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        {/* Voice name and time */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{currentVoiceName}</p>
          <p className="text-xs text-muted-foreground">
            {formatTime(progress.currentTime)} / {formatTime(progress.duration)}
          </p>
        </div>

        {/* Volume icon */}
        <div className="text-muted-foreground">
          <VolumeIcon volume={volume} />
        </div>

        {/* Expand indicator */}
        {!isExpanded && (
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <span>Tap to expand</span>
            <ChevronUp className="h-3 w-3" />
          </div>
        )}
      </div>

      {/* Expanded controls */}
      {isExpanded && (
        <div className="px-4 py-3 space-y-4">
          {/* Skip controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleSkipBackward();
              }}
              aria-label="Skip backward 15 seconds"
              className="h-10 w-10 rounded-full"
            >
              <RotateCcw className="h-5 w-5" />
              <span className="sr-only">-15s</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleSkipForward();
              }}
              aria-label="Skip forward 15 seconds"
              className="h-10 w-10 rounded-full"
            >
              <RotateCcw className="h-5 w-5 scale-x-[-1]" />
              <span className="sr-only">+15s</span>
            </Button>
          </div>

          {/* Speed control */}
          <div className="relative flex items-center gap-3">
            <ListOrdered className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium w-12">Speed</span>
            
            <Button
              data-testid="speed-button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowSpeedSelector(!showSpeedSelector);
              }}
              className="flex-1 justify-between h-8"
            >
              <span>{getSpeedLabel(playbackRate)}</span>
            </Button>

            {/* Speed selector dropdown */}
            {showSpeedSelector && (
              <div 
                data-testid="speed-selector"
                className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-10 p-1 grid grid-cols-4 gap-1"
              >
                {SPEED_OPTIONS.map((speed) => (
                  <Button
                    key={speed}
                    variant={playbackRate === speed ? "default" : "ghost"}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeedSelect(speed);
                    }}
                    className="h-8 text-xs"
                  >
                    {getSpeedLabel(speed)}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Volume control */}
          <div className="flex items-center gap-3">
            <VolumeIcon volume={volume} />
            <span className="text-sm font-medium w-12">Volume</span>
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              min={0}
              max={1}
              step={0.1}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground w-10 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Collapse button */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="text-xs text-muted-foreground"
            >
              Collapse
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
