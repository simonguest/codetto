<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { VideoPlayer } from '@videojs-player/vue';

import type { Cell } from '@schemas/notebook';
import type { Locale } from '@/i18n';
import { notebookStore } from '@store/notebookStore';

import type { VideoConfig, ProcessedVideoSource } from './types';

import 'video.js/dist/video-js.css';

const props = defineProps<{
  cell: Cell;
  locale: Locale | null;
}>();

const error = ref<string | null>(null);
const videoConfig = ref<VideoConfig | null>(null);
const processedSource = ref<ProcessedVideoSource | null>(null);
const iframeError = ref<boolean>(false);
const showFallback = ref<boolean>(false);

/**
 * Extract video ID from YouTube URL
 */
const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

/**
 * Extract video ID from Vimeo URL
 */
const extractVimeoId = (url: string): string | null => {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

/**
 * Process video URL to get the appropriate source for the player
 */
const processVideoUrl = (config: VideoConfig): ProcessedVideoSource => {
  const url = config.url;
  
  // Check for YouTube
  const youtubeId = extractYouTubeId(url);
  if (youtubeId) {
    return {
      url: `https://www.youtube.com/embed/${youtubeId}`,
      provider: 'youtube',
      isEmbed: true
    };
  }
  
  // Check for Vimeo
  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    return {
      url: `https://player.vimeo.com/video/${vimeoId}`,
      provider: 'vimeo',
      isEmbed: true
    };
  }
  
  // Direct video file
  return {
    url: url,
    provider: 'direct',
    isEmbed: false
  };
};

/**
 * Parse the JSON configuration from the cell source
 */
const parseVideoConfig = (): void => {
  try {
    const source = notebookStore.getLocalizedSource(props.cell.id, props.locale);
    if (!source || source.length === 0) {
      throw new Error('No video configuration found');
    }
    
    const jsonString = source.join('').trim();
    const config = JSON.parse(jsonString) as VideoConfig;
    
    if (!config.url) {
      throw new Error('Video URL is required');
    }
    
    videoConfig.value = {
      controls: true,
      autoplay: false,
      width: '100%',
      height: 'auto',
      loop: false,
      muted: false,
      ...config
    };
    
    processedSource.value = processVideoUrl(config);
    error.value = null;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Invalid video configuration';
    videoConfig.value = null;
    processedSource.value = null;
  }
};

/**
 * Video.js player options
 */
const playerOptions = computed(() => {
  if (!videoConfig.value || !processedSource.value) return {};
  
  const options: any = {
    controls: videoConfig.value.controls,
    autoplay: videoConfig.value.autoplay,
    loop: videoConfig.value.loop,
    muted: videoConfig.value.muted,
    fluid: true,
    responsive: true,
    playbackRates: [0.5, 1, 1.25, 1.5, 2],
    plugins: {}
  };
  
  if (videoConfig.value.poster) {
    options.poster = videoConfig.value.poster;
  }
  
  // For direct video files, set the source
  if (processedSource.value.provider === 'direct') {
    options.sources = [{
      src: processedSource.value.url,
      type: 'video/mp4' // Default to mp4, could be enhanced to detect type
    }];
  }
  
  return options;
});

/**
 * Handle iframe for embedded videos (YouTube, Vimeo)
 */
const shouldUseIframe = computed(() => {
  return processedSource.value?.isEmbed || false;
});

/**
 * Iframe source URL with parameters
 */
const iframeSrc = computed(() => {
  if (!processedSource.value || !videoConfig.value) return '';
  
  const url = new URL(processedSource.value.url);
  
  // Add common parameters
  if (videoConfig.value.autoplay) {
    url.searchParams.set('autoplay', '1');
  }
  if (!videoConfig.value.controls) {
    url.searchParams.set('controls', '0');
  }
  if (videoConfig.value.loop) {
    url.searchParams.set('loop', '1');
  }
  if (videoConfig.value.muted) {
    url.searchParams.set('muted', '1');
  }
  
  return url.toString();
});

/**
 * Handle iframe load errors
 */
const handleIframeError = () => {
  iframeError.value = true;
};

/**
 * Open video in new tab as fallback
 */
const openVideoInNewTab = () => {
  if (videoConfig.value?.url) {
    window.open(videoConfig.value.url, '_blank');
  }
};

onMounted(() => {
  parseVideoConfig();
  
  // For Vimeo videos on localhost, show fallback immediately
  // as Vimeo typically blocks localhost embedding
  if (processedSource.value?.provider === 'vimeo' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    setTimeout(() => {
      if (!iframeError.value) {
        iframeError.value = true;
      }
    }, 2000); // Give it 2 seconds to load, then show fallback
  }
});

// Watch for locale changes and reparse the video config
watch(() => props.locale, () => {
  parseVideoConfig();
});
</script>

<template>
  <v-card variant="text" max-width="800" class="pt-2 pb-2 ma-auto">
    <v-card-text>
      <!-- Error State -->
      <v-alert 
        v-if="error" 
        type="error" 
        variant="tonal"
        :text="error"
        class="mb-4"
      />
      
      <!-- Video Player -->
      <div v-else-if="videoConfig && processedSource" class="video-container">
        <!-- Embedded Videos (YouTube, Vimeo) -->
        <div v-if="shouldUseIframe && !iframeError" class="video-iframe-container">
          <iframe
            :src="iframeSrc"
            :width="videoConfig.width"
            :height="videoConfig.height === 'auto' ? '315' : videoConfig.height"
            frameborder="0"
            allowfullscreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            class="video-iframe"
            @error="handleIframeError"
          />
        </div>
        
        <!-- Iframe Error Fallback -->
        <div v-else-if="shouldUseIframe && iframeError" class="video-fallback">
          <v-card variant="outlined" class="pa-6 text-center">
            <v-icon size="64" color="grey-darken-1" class="mb-4">mdi-video-off</v-icon>
            <h3 class="text-h6 mb-2">Video Embedding Restricted</h3>
            <p class="text-body-2 mb-4">
              This {{ processedSource.provider }} video cannot be embedded in this environment.
              <br>
              This is common when running on localhost due to CORS restrictions.
            </p>
            <v-btn 
              color="primary" 
              variant="elevated"
              @click="openVideoInNewTab"
              prepend-icon="mdi-open-in-new"
            >
              Watch on {{ processedSource.provider === 'youtube' ? 'YouTube' : 'Vimeo' }}
            </v-btn>
            <p class="text-caption mt-2 text-grey">
              URL: {{ videoConfig.url }}
            </p>
          </v-card>
        </div>
        
        <!-- Direct Video Files -->
        <div v-else class="video-player-container">
          <VideoPlayer
            :options="playerOptions"
            class="video-player"
          />
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-else class="text-center pa-4">
        <v-progress-circular indeterminate color="primary" />
        <p class="mt-2 text-body-2">Loading video...</p>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.video-container {
  width: 100%;
  max-width: 100%;
}

.video-iframe-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  overflow: hidden;
}

.video-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.video-player-container {
  width: 100%;
}

.video-player {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

/* Video.js custom styling */
:deep(.video-js) {
  font-family: inherit;
}

:deep(.video-js .vjs-big-play-button) {
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.7);
  border: 2px solid #fff;
}

:deep(.video-js .vjs-control-bar) {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
}

/* Responsive design */
@media (max-width: 600px) {
  .video-iframe-container {
    padding-bottom: 75%; /* Adjust aspect ratio for mobile */
  }
}
</style>
