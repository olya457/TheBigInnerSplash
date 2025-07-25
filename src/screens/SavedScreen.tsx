import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
  FlatList,
  TouchableOpacity,
  Share,
  Image,
  Alert,
  Animated, 
  PixelRatio, 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const BASE_WIDTH = 414; 
const BASE_HEIGHT = 896; 

const scaleWidth = (size: number) => (width / BASE_WIDTH) * size;
const scaleHeight = (size: number) => (height / BASE_HEIGHT) * size;
const responsiveFontSize = (size: number) => {
  const fontScale = PixelRatio.getFontScale();
  return size / fontScale;
};

type SavedAffirmation = {
  date: string; 
  displayDate: string; 
  text: string;
};

type SavedAffirmationCardProps = {
  item: SavedAffirmation;
  index: number;
  onShare: (text: string) => void;
  onDelete: (date: string) => void; 
};

const SavedAffirmationCard: React.FC<SavedAffirmationCardProps> = ({ item, index, onShare, onDelete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current; 
  const translateY = useRef(new Animated.Value(20)).current; 

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100, 
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay: index * 100, 
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim, 
          transform: [{ translateY }], 
        },
      ]}
    >
      <Text style={styles.cardTitle}>
        {item.displayDate} AFFIRMATION
      </Text>
      <Text style={styles.cardText}>{item.text}</Text>
      <View style={styles.buttonsRow}>
        <TouchableOpacity onPress={() => onShare(item.text)}>
          <Image
            source={require('../assets/icon_share.png')}
            style={styles.icon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item.date)}>
          <Image
            source={require('../assets/icon_saved_highlighted.png')}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};


const SavedScreen = () => {
  const [savedList, setSavedList] = useState<SavedAffirmation[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loadSaved = async () => {
        try {
          const keys = await AsyncStorage.getAllKeys();

          const affKeys = keys.filter(k => k.startsWith('affirmation_'));
          const entries = await AsyncStorage.multiGet(affKeys);

          const parsedFromKeys: SavedAffirmation[] = entries.map(([key, value]) => {
            const fullDateString = key.replace('affirmation_', '');
            const dateObj = new Date(fullDateString);
            const displayDate = isNaN(dateObj.getTime()) ? '—' : dateObj.toLocaleDateString('en-GB').replace(/\//g, '.');

            return {
              date: fullDateString,
              displayDate: displayDate,
              text: value || ''
            };
          });

          const arrayJson = await AsyncStorage.getItem('savedAffirmations');
          const parsedArray: SavedAffirmation[] = arrayJson
            ? JSON.parse(arrayJson).map((text: string, index: number) => {
                const today = new Date();
                const formatted = today.toLocaleDateString('en-GB').replace(/\//g, '.');

                return {
                  date: `manual_${Date.now()}_${index}`,
                  displayDate: formatted,
                  text,
                };
              })
            : [];

          const allCombined = [...parsedFromKeys, ...parsedArray];

          const uniqueCombined = Array.from(new Map(allCombined.map(item => [item.text, item])).values());


          uniqueCombined.sort((a, b) => {
            const timeA = new Date(a.date.startsWith('manual_') ? 0 : a.date).getTime();
            const timeB = new Date(b.date.startsWith('manual_') ? 0 : b.date).getTime();
            
            if (a.date.startsWith('manual_') && b.date.startsWith('manual_')) {
                return 0; 
            }
            if (a.date.startsWith('manual_')) {
                return 1;
            }
            if (b.date.startsWith('manual_')) {
                return -1;
            }
            return timeB - timeA;
          });

          setSavedList(uniqueCombined);
        } catch (error) {
          console.error('Error loading saved affirmations:', error);
          Alert.alert('Error', 'Failed to load saved affirmations. Please try again.');
        }
      };

      loadSaved();
      return () => {}; 
    }, [])
  );

  const handleShare = async (text: string) => {
    try {
      await Share.share({ message: text });
    } catch (e) {
      console.error('Share error', e);
      Alert.alert('Share Error', 'Could not share affirmation.');
    }
  };

  const handleDeleteSpecificAffirmation = async (date: string) => {
    Alert.alert(
      'Delete Affirmation',
      'Are you sure you want to delete this affirmation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (date.startsWith('manual_')) {
              const arrayJson = await AsyncStorage.getItem('savedAffirmations');
              let currentArray: string[] = arrayJson ? JSON.parse(arrayJson) : [];

              const itemToDelete = savedList.find(item => item.date === date);
              if (itemToDelete) {
                  currentArray = currentArray.filter(text => text !== itemToDelete.text);
                  await AsyncStorage.setItem('savedAffirmations', JSON.stringify(currentArray));
              }

            } else {
              await AsyncStorage.removeItem(`affirmation_${date}`);
            }

            setSavedList(prev => prev.filter(item => item.date !== date));
          },
        },
      ]
    );
  };

  const handleResetAll = () => {
    Alert.alert('Delete All Saved', 'Are you sure you want to delete all saved affirmations?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All',
        style: 'destructive',
        onPress: async () => {
          const keys = await AsyncStorage.getAllKeys();
          const keysToRemove = keys.filter(k => k.startsWith('affirmation_') || k === 'savedAffirmations');
          await AsyncStorage.multiRemove(keysToRemove);
          setSavedList([]); 
          console.log('All affirmations deleted.');
        },
      },
    ]);
  };

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
    >
      <View style={styles.headerContainer}>
        <View style={styles.headerBackground}>
          <Text style={styles.headerText}>SAVED</Text>
        </View>
        <TouchableOpacity onPress={handleResetAll} style={styles.headerButton}>
          <Image
            source={require('../assets/button.png')}
            style={styles.headerButtonIcon}
          />
        </TouchableOpacity>
      </View>

      {savedList.length === 0 ? (
        <View style={styles.emptyListContainer}>
          <Text style={styles.emptyListText}>No saved affirmations yet.</Text>
        </View>
      ) : (
        <FlatList
          data={savedList}
          keyExtractor={(item, index) => item.date + index.toString()} 
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <SavedAffirmationCard
              item={item}
              index={index}
              onShare={handleShare}
              onDelete={handleDeleteSpecificAffirmation}
            />
          )}
        />
      )}
    </ImageBackground>
  );
};

export default SavedScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  headerContainer: {
    marginTop: scaleHeight(60),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: width * 0.9,
    alignSelf: 'center',
  },
  headerBackground: {
    height: scaleHeight(70),
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: scaleWidth(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(20),
    flex: 1,
    marginRight: scaleWidth(10),
    borderWidth: scaleWidth(2),
    borderColor: 'white',
  },
  headerText: {
    fontSize: responsiveFontSize(24),
    color: 'white',
    fontWeight: 'bold',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 2,
  },
  headerButton: {
    width: scaleWidth(70),
    height: scaleHeight(70),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonIcon: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: responsiveFontSize(18),
    color: 'white',
    textAlign: 'center',
  },
  list: {
    paddingTop: scaleHeight(40),
    paddingBottom: scaleHeight(60),
    alignItems: 'center',
  },
  card: {
    width: width * 0.9,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: scaleWidth(20),
    padding: scaleWidth(20),
    marginBottom: scaleHeight(16),
  },
  cardTitle: {
    fontSize: responsiveFontSize(18),
    color: '#000',
    fontWeight: '900',
    marginBottom: scaleHeight(8),
  },
  cardText: {
    color: '#fff',
    fontSize: responsiveFontSize(15),
    marginBottom: scaleHeight(12),
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scaleWidth(30),
  },
  icon: {
    width: scaleWidth(60),
    height: scaleHeight(60),
    resizeMode: 'contain',
  },
});