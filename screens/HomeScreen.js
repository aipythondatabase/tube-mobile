import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  StatusBar, 
  SafeAreaView, 
  Platform,
  LayoutAnimation,
  UIManager,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  BackHandler
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { youtubeApi } from '../services/youtubeApi';
import VideoCard from '../components/VideoCard';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const BLOCKED_VIDEOS_KEY = 'blocked_videos_abyss';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 履歴レイヤー・コンポーネント
const MemoryLayer = ({ history, onClose, onVideoPlay }) => {
  if (!history || history.length === 0) return null;
  return (
    <View style={styles.overlayContainer}>
      <View style={styles.overlayHeader}>
        <Text style={styles.overlayTitle}>表示履歴</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close-outline" size={24} color="#ff4444" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.overlayScroll}>
        {history.map((set, setIndex) => (
          <View key={`set-${setIndex}`} style={styles.memorySet}>
            <Text style={styles.setTime}>セット {String(history.length - setIndex).padStart(2, '0')}</Text>
            <View style={styles.memoryGrid}>
              {set.map((video, vIndex) => (
                <TouchableOpacity 
                  key={`mem-${setIndex}-${vIndex}`} 
                  style={styles.memoryThumbnailWrapper}
                  onPress={() => onVideoPlay(video)}
                >
                  <Image source={{ uri: video.snippet?.thumbnails?.default?.url }} style={styles.memoryThumbnail} />
                  <View style={styles.memoryTitleOverlay}>
                    <Text style={styles.memoryTitleText} numberOfLines={1}>{video.snippet?.title}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )).reverse()}
      </ScrollView>
    </View>
  );
};

export default function HomeScreen({ navigation }) {
  const [rows, setRows] = useState([]); 
  const [stock, setStock] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isRefreshingStock, setIsRefreshingStock] = useState(false);
  const [activeHistory, setActiveHistory] = useState(null);
  
  const [isBlockMode, setIsBlockMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [blockedIds, setBlockedIds] = useState(new Set());

  const isFetchingRef = useRef(false);

  // 戻るボタンの制御
  useEffect(() => {
    const backAction = () => {
      if (activeHistory) { setActiveHistory(null); return true; }
      if (isBlockMode) { setIsBlockMode(false); setSelectedIds(new Set()); return true; }
      return false;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [activeHistory, isBlockMode]);

  useEffect(() => {
    loadBlockedData().then(() => initialLoad());
  }, []);

  const loadBlockedData = async () => {
    try {
      const data = await AsyncStorage.getItem(BLOCKED_VIDEOS_KEY);
      if (data) setBlockedIds(new Set(JSON.parse(data)));
    } catch (e) { console.error(e); }
  };

  const initialLoad = async () => {
    try {
      setLoading(true);
      const fetchedVideos = await youtubeApi.getPopularVideos(100);
      const filtered = fetchedVideos.filter(v => !blockedIds.has(v.id?.videoId || v.id));
      
      const initialRows = [];
      for (let i = 0; i < Math.min(filtered.length, 40); i += 4) {
        initialRows.push({ id: `row-${i}`, current: filtered.slice(i, i + 4), history: [] });
      }
      setRows(initialRows);
      setStock(filtered.slice(40));
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const replenishStock = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsRefreshingStock(true);
    try {
      const newVideos = await youtubeApi.getPopularVideos(50);
      const filtered = newVideos.filter(v => !blockedIds.has(v.id?.videoId || v.id));
      setStock(prev => [...prev, ...filtered]);
    } catch (e) { console.error(e); } finally {
      isFetchingRef.current = false;
      setIsRefreshingStock(false);
    }
  };

  const handleRefreshRow = useCallback((rowIndex) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRows(prevRows => {
      const newRows = [...prevRows];
      const targetRow = { ...newRows[rowIndex] };
      targetRow.history = [...targetRow.history, targetRow.current];
      if (stock.length >= 4) {
        targetRow.current = stock.slice(0, 4);
        setStock(prev => prev.slice(4));
      }
      newRows[rowIndex] = targetRow;
      return newRows;
    });
    if (stock.length <= 12) replenishStock();
  }, [stock, blockedIds]);

  const handleRefreshAll = useCallback(() => {
    if (stock.length < rows.length * 4) {
      replenishStock();
      Alert.alert('読み込み中', '動画リストを更新しています。少々お待ちください。');
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRows(prevRows => {
      let currentStock = [...stock];
      const newRows = prevRows.map(row => {
        const updatedRow = { ...row };
        updatedRow.history = [...updatedRow.history, updatedRow.current];
        updatedRow.current = currentStock.slice(0, 4);
        currentStock = currentStock.slice(4);
        return updatedRow;
      });
      setStock(currentStock);
      return newRows;
    });
    if (stock.length <= 20) replenishStock();
  }, [rows, stock]);

  const toggleSelect = (videoId) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(videoId)) newSelected.delete(videoId);
    else newSelected.add(videoId);
    setSelectedIds(newSelected);
  };

  const handlePurge = async () => {
    if (selectedIds.size === 0) { setIsBlockMode(false); return; }
    
    Alert.alert('ブロック確認', `${selectedIds.size}個の動画をブロックリストに追加しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      { text: 'ブロックする', onPress: async () => {
        const newBlocked = new Set([...blockedIds, ...selectedIds]);
        await AsyncStorage.setItem(BLOCKED_VIDEOS_KEY, JSON.stringify([...newBlocked]));
        setBlockedIds(newBlocked);
        
        // stockを直接変更（shift）せず、コピーを作成して処理する
        let currentStock = [...stock];
        
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setRows(prev => prev.map(row => ({
          ...row,
          current: row.current.map(v => {
            const vId = v.id?.videoId || v.id;
            if (selectedIds.has(vId)) {
              // 選択された動画をストックから補充
              return currentStock.length > 0 ? currentStock.shift() : v;
            }
            return v;
          })
        })));
        
        // 新しいstockの状態を一括で反映
        setStock(currentStock);
        setSelectedIds(new Set());
        setIsBlockMode(false);
      }}
    ]);
  };

  const handleVideoPlay = (video) => {
    if (isBlockMode) return;
    const videoId = video.id?.videoId || video.id;
    navigation.navigate('VideoPlayer', { videoId, title: video.snippet?.title || '' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.megaHeader}>
        <View style={styles.headerStatusRow}>
          <Text style={styles.systemStatus}>{isBlockMode ? 'ブロックモード実行中' : 'システム：正常'}</Text>
          <Text style={styles.bufferText}>ストック: {stock.length}</Text>
        </View>

        <View style={styles.headerMainRow}>
          <View style={styles.sideColumn} />
          
          <TouchableOpacity 
            onPress={handleRefreshAll} 
            activeOpacity={0.6}
            style={styles.titleButton}
          >
            <Text style={styles.mainTitle}>蒼銀の断罪</Text>
          </TouchableOpacity>

          <View style={styles.sideColumn}>
            <TouchableOpacity 
              onPress={isBlockMode ? handlePurge : () => setIsBlockMode(true)} 
              style={styles.headerIconButton}
              hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }}
            >
              <Ionicons 
                name={isBlockMode ? "checkmark-circle" : "shield-half-outline"} 
                size={22} 
                color={isBlockMode ? "#c084fc" : "#8b5e3c"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerBottom}>
          <View style={[styles.glowBar, (isRefreshingStock || isBlockMode) && styles.syncGlow, isBlockMode && {backgroundColor: '#c084fc'}]} />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="small" color="#8b5e3c" /><Text style={styles.loadingText}>動画を読み込み中...</Text></View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {rows.map((row, rowIndex) => (
            <View key={row.id} style={styles.rowContainer}>
              {row.current.map((video, vIndex) => {
                const vId = video.id?.videoId || video.id;
                return (
                  <VideoCard 
                    key={`${row.id}-${vId}-${vIndex}`}
                    video={video}
                    role={vIndex === 0 ? 'left' : vIndex === 3 ? 'right' : 'center'}
                    isSelectable={isBlockMode}
                    isSelected={selectedIds.has(vId)}
                    onSelect={() => toggleSelect(vId)}
                    onPlay={() => handleVideoPlay(video)}
                    onRefresh={() => handleRefreshRow(rowIndex)}
                    onHistory={() => setActiveHistory(row.history)}
                  />
                );
              })}
            </View>
          ))}
          <View style={styles.footer}><Text style={styles.footerText}>{isBlockMode ? 'ブロックする動画を選択してください' : '左端：リフレッシュ // 右端：履歴'}</Text></View>
        </ScrollView>
      )}
      {activeHistory && <MemoryLayer history={activeHistory} onClose={() => setActiveHistory(null)} onVideoPlay={handleVideoPlay} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1614' },
  megaHeader: { 
    backgroundColor: '#1a1614', 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    paddingBottom: 8, 
    borderBottomWidth: 1, 
    borderBottomColor: '#2d2421' 
  },
  headerStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerMainRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  titleButton: {
    paddingVertical: 2,
  },
  headerIconButton: {
    padding: 5,
  },
  systemStatus: { color: '#238636', fontSize: 7, fontWeight: 'bold', fontFamily: 'monospace' },
  bufferText: { color: '#8b5e3c', fontSize: 7, fontFamily: 'monospace' },
  mainTitle: { color: '#cbd5e1', fontSize: 24, fontWeight: '900', letterSpacing: 6, textAlign: 'center', textShadowColor: 'rgba(148, 163, 184, 0.5)', textShadowOffset: {width: 0, height: 0}, textShadowRadius: 10 },
  headerBottom: { marginTop: 10, height: 2, backgroundColor: '#2d2421', width: '100%', overflow: 'hidden' },
  glowBar: { height: '100%', width: '30%', backgroundColor: '#8b5e3c', alignSelf: 'center' },
  syncGlow: { backgroundColor: '#58a6ff', width: '100%' },
  scrollView: { flex: 1 },
  rowContainer: { flexDirection: 'row', backgroundColor: '#000', marginBottom: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  loadingText: { color: '#8b5e3c', marginTop: 10, fontSize: 9 },
  overlayContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 10, 12, 0.98)', zIndex: 100, paddingTop: 50 },
  overlayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  overlayTitle: { color: '#e6d5c3', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  closeButton: { padding: 5 },
  overlayScroll: { paddingHorizontal: 15, paddingBottom: 50 },
  memorySet: { marginBottom: 25, borderBottomWidth: 1, borderBottomColor: '#2d2421', paddingBottom: 10 },
  setTime: { color: '#444', fontSize: 8, marginBottom: 8, fontFamily: 'monospace' },
  memoryGrid: { flexDirection: 'row' },
  memoryThumbnailWrapper: { width: (width - 60) / 4, aspectRatio: 1, marginRight: 5, backgroundColor: '#000', position: 'relative', overflow: 'hidden' },
  memoryThumbnail: { width: '100%', height: '100%', opacity: 0.6 },
  memoryTitleOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', padding: 1 },
  memoryTitleText: { color: '#e6d5c3', fontSize: 5, fontWeight: 'bold' },
  footer: { padding: 40, alignItems: 'center' },
  footerText: { color: '#3d322d', fontSize: 8, letterSpacing: 1 },
});
