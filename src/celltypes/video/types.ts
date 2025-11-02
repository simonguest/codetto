/**
 * Configuration interface for video cells
 */
export interface VideoConfig {
  /** Video URL - can be from YouTube, Vimeo, or direct video file */
  url: string;
  /** Optional poster image URL */
  poster?: string;
  /** Whether to autoplay the video (default: false) */
  autoplay?: boolean;
  /** Whether to show video controls (default: true) */
  controls?: boolean;
  /** Video width (default: "100%") */
  width?: string;
  /** Video height (default: "auto") */
  height?: string;
  /** Whether to loop the video (default: false) */
  loop?: boolean;
  /** Whether to mute the video (default: false) */
  muted?: boolean;
}

/**
 * Processed video source information
 */
export interface ProcessedVideoSource {
  /** The processed URL ready for the video player */
  url: string;
  /** The detected video provider */
  provider: 'youtube' | 'vimeo' | 'direct';
  /** Whether this is an embed URL */
  isEmbed: boolean;
}
