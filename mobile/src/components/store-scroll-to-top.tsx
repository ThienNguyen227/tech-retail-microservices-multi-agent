import { createContext, useCallback, useContext, useMemo, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { FlatList, Pressable, ScrollView, View, type FlatListProps, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewProps } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Target = { scrollTo?: (options: { y: number; animated: boolean }) => void; scrollToOffset?: (options: { offset: number; animated: boolean }) => void };
type Controls = {
  register: (target: Target, offset: number) => () => void;
  update: (target: Target, offset: number) => void;
  setFooterHeight: (height: number) => void;
};
const Context = createContext<Controls | null>(null);

export function StoreScrollToTopProvider({ children }: { children: ReactNode }) {
  const active = useRef<Target | null>(null);
  const [visible, setVisible] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const register = useCallback((target: Target, offset: number) => {
    active.current = target;
    setVisible(offset > 300);
    return () => {
      if (active.current === target) {
        active.current = null;
        setVisible(false);
      }
    };
  }, []);
  const update = useCallback((target: Target, offset: number) => {
    if (active.current === target) setVisible(offset > 300);
  }, []);
  const controls = useMemo(() => ({ register, update, setFooterHeight }), [register, update]);

  const scrollToTop = () => {
    const target = active.current;
    if (target?.scrollToOffset) target.scrollToOffset({ offset: 0, animated: true });
    else target?.scrollTo?.({ y: 0, animated: true });
  };

  return <Context.Provider value={controls}>
    {children}
    {visible ? <View pointerEvents="box-none" style={{ position: 'absolute', right: 22, bottom: insets.bottom + (footerHeight > 0 ? footerHeight + 12 : 16), zIndex: 49 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Lên đầu trang" onPress={scrollToTop}
        className="h-11 w-11 items-center justify-center rounded-full border border-teal-100 bg-teal-700 active:bg-teal-800"
        style={{ elevation: 5, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.16, shadowRadius: 6 }}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="m6 12 6-6 6 6M12 6v13" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>
    </View> : null}
  </Context.Provider>;
}

export function useStoreScrollControls() {
  const context = useContext(Context);
  if (!context) throw new Error('StoreScrollToTopProvider chưa được thiết lập');
  return context;
}

function useMainScroll<T extends Target>(onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void) {
  const ref = useRef<T | null>(null);
  const offset = useRef(0);
  const { register, update } = useStoreScrollControls();
  useFocusEffect(useCallback(() => {
    const target = ref.current;
    if (target) return register(target, offset.current);
  }, [register]));
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = event.nativeEvent.contentOffset.y;
    if (ref.current) update(ref.current, offset.current);
    onScroll?.(event);
  }, [update, onScroll]);
  return { ref, onScroll: handleScroll };
}

// Chỉ thay vùng cuộn chính; carousel và modal giữ ScrollView gốc.
export function StoreScrollView(props: ScrollViewProps) {
  const scroll = useMainScroll<ComponentRef<typeof ScrollView>>(props.onScroll);
  return <ScrollView {...props} {...scroll} scrollEventThrottle={16} />;
}

export function StoreFlatList<T>(props: FlatListProps<T>) {
  const scroll = useMainScroll<FlatList<T>>(props.onScroll);
  return <FlatList {...props} {...scroll} scrollEventThrottle={16} />;
}
