const YOUTUBE_API_KEY = 'AIzaSyATiULH7dW5PLdRBdj_4Hd2WNg4OoJyzsI';

export const youtubeApi = {
  // 人気の動画を取得
  getPopularVideos: async (regionCode = 'JP', maxResults = 20) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&regionCode=${regionCode}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
      );
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching popular videos:', error);
      return [];
    }
  },

  // 検索
  searchVideos: async (query, maxResults = 20) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
      );
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error searching videos:', error);
      return [];
    }
  },

  // 動画詳細を取得
  getVideoDetails: async (videoId) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`
      );
      const data = await response.json();
      return data.items?.[0] || null;
    } catch (error) {
      console.error('Error fetching video details:', error);
      return null;
    }
  },
};
