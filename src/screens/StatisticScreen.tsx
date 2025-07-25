import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  ImageBackground,
  Share,
  ScrollView, 
  Animated,
  Alert,
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
  return (size / fontScale) * (width / BASE_WIDTH);
};

type ProfileKey = 'soul' | 'spark' | 'seeker';
type MoodKey = 'grounded' | 'driven' | 'flow';

const avatarImages: Record<ProfileKey, any> = {
  soul: require('../assets/soul.png'),
  spark: require('../assets/spark.png'),
  seeker: require('../assets/seeker.png'),
};

const moodColors: Record<MoodKey, string> = {
  grounded: '#6BFF81', 
  driven: '#FEE101',   
  flow: '#FF7997',    
};

const StatisticScreen: React.FC = () => {
  const [profile, setProfile] = useState<ProfileKey>('soul');
  const [moodStats, setMoodStats] = useState<Record<MoodKey, number>>({
    grounded: 0,
    driven: 0,
    flow: 0,
  });
  const [totalTasks, setTotalTasks] = useState<number>(0);

  const myProfileTextAnim = useRef(new Animated.Value(0)).current;
  const avatarAnim = useRef(new Animated.Value(0)).current;
  const statsCardAnim = useRef(new Animated.Value(0)).current;
  const groundedBarAnim = useRef(new Animated.Value(0)).current;
  const drivenBarAnim = useRef(new Animated.Value(0)).current;
  const flowBarAnim = useRef(new Animated.Value(0)).current;

  const loadAndAnimateStats = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const moodKeys = keys.filter((key) => key.startsWith('mood_'));

      const entries = await AsyncStorage.multiGet(moodKeys);
      const moodCounts: Record<MoodKey, number> = {
        grounded: 0,
        driven: 0,
        flow: 0,
      };

      entries.forEach(([, value]) => {
        if (value) {
          try {
            const parsed = JSON.parse(value);
            const mood = parsed.mood as MoodKey;
            if (mood in moodCounts) {
              moodCounts[mood]++;
            }
          } catch (e) {
            console.warn('Invalid mood entry:', value);
          }
        }
      });

      setMoodStats(moodCounts);
      setTotalTasks(moodKeys.length);

      const storedProfile = await AsyncStorage.getItem('quizResult');
      if (storedProfile === 'soul' || storedProfile === 'spark' || storedProfile === 'seeker') {
        setProfile(storedProfile);
      }

      myProfileTextAnim.setValue(0);
      avatarAnim.setValue(0);
      statsCardAnim.setValue(0);
      groundedBarAnim.setValue(0);
      drivenBarAnim.setValue(0);
      flowBarAnim.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(myProfileTextAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(avatarAnim, {
            toValue: 1,
            duration: 600,
            delay: 100, 
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(statsCardAnim, {
          toValue: 1,
          duration: 700,
          delay: 200, 
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(groundedBarAnim, {
            toValue: 1,
            duration: 800,
            delay: 300,
            useNativeDriver: false, 
          }),
          Animated.timing(flowBarAnim, {
            toValue: 1,
            duration: 800,
            delay: 400,
            useNativeDriver: false,
          }),
          Animated.timing(drivenBarAnim, {
            toValue: 1,
            duration: 800,
            delay: 500,
            useNativeDriver: false,
          }),
        ]),
      ]).start();
    } catch (error) {
      console.error('Error loading and animating statistics:', error);
      Alert.alert('Error', 'Failed to load statistics. Please try again.');
    }
  }, [myProfileTextAnim, avatarAnim, statsCardAnim, groundedBarAnim, drivenBarAnim, flowBarAnim]);

  useFocusEffect(
    useCallback(() => {
      loadAndAnimateStats();

      return () => {
        myProfileTextAnim.setValue(0);
        avatarAnim.setValue(0);
        statsCardAnim.setValue(0);
        groundedBarAnim.setValue(0);
        drivenBarAnim.setValue(0);
        flowBarAnim.setValue(0);
      };
    }, [loadAndAnimateStats, myProfileTextAnim, avatarAnim, statsCardAnim, groundedBarAnim, drivenBarAnim, flowBarAnim]) 
  );

  const total = Object.values(moodStats).reduce((sum, val) => sum + val, 0);
  const getPercentage = (val: number): number => (total > 0 ? Math.round((val / total) * 100) : 0);

  const onShare = async () => {
    try {
      await Share.share({
        message: `I've completed ${totalTasks} daily rituals! My mood statistics: Grounded ${getPercentage(
          moodStats.grounded
        )}%, Driven ${getPercentage(moodStats.driven)}%, In Flow ${getPercentage(moodStats.flow)}%.`,
      });
    } catch (error: any) {
      console.error('Error sharing statistics:', error.message);
      Alert.alert('Share Error', 'Could not share statistics.');
    }
  };

  const handleResetStats = () => {
    Alert.alert(
      'Reset Statistics',
      'Are you sure you want to delete all mood statistics? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const moodKeysToDelete = keys.filter(k => k.startsWith('mood_'));
              await AsyncStorage.multiRemove(moodKeysToDelete);

              loadAndAnimateStats();
              console.log('All mood statistics have been reset.');
            } catch (error) {
              console.error('Error resetting mood statistics:', error);
              Alert.alert('Error', 'Failed to reset statistics. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.container}>
          {}
          <View style={styles.topHeaderContainer}>
            {}
            <Animated.View
              style={[
                styles.headerBackground,
                {
                  opacity: myProfileTextAnim,
                  transform: [
                    {
                      scale: myProfileTextAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.headerText}>MY PROFILE</Text>
            </Animated.View>
            {}
            <TouchableOpacity onPress={handleResetStats} style={styles.resetStatsButton}>
              <Image
                source={require('../assets/button.png')}
                style={styles.resetStatsButtonIcon}
              />
            </TouchableOpacity>
          </View>

          {}
          <Animated.Image
            source={avatarImages[profile]}
            style={[
              styles.fullImage,
              { opacity: avatarAnim, transform: [{ translateY: avatarAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [scaleHeight(50), 0] 
              })}]}
            ]}
            resizeMode="contain"
          />

          {}
          <Animated.View
            style={[
              styles.statsCard,
              {
                opacity: statsCardAnim,
                transform: [
                  {
                    translateY: statsCardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [scaleHeight(50), 0], 
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.statsTitle}>My statistics</Text>

            {}
            <View style={styles.chartRow}>
              {}
              <View style={styles.chartItem}>
                <Text style={[styles.percentText, { color: moodColors.grounded }]}>
                  {getPercentage(moodStats.grounded)}%
                </Text>
                <Animated.View
                  style={[
                    styles.bar,
                    {
                      height: groundedBarAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, Math.min(getPercentage(moodStats.grounded) * scaleHeight(1.1), scaleHeight(110))], 
                      }),
                      backgroundColor: moodColors.grounded,
                    },
                  ]}
                />
              </View>

              {}
              <View style={styles.chartItem}>
                <Text style={[styles.percentText, { color: moodColors.flow }]}>
                  {getPercentage(moodStats.flow)}%
                </Text>
                <Animated.View
                  style={[
                    styles.bar,
                    {
                      height: flowBarAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, Math.min(getPercentage(moodStats.flow) * scaleHeight(1.1), scaleHeight(110))],
                      }),
                      backgroundColor: moodColors.flow,
                    },
                  ]}
                />
              </View>

              {}
              <View style={styles.chartItem}>
                <Text style={[styles.percentText, { color: moodColors.driven }]}>
                  {getPercentage(moodStats.driven)}%
                </Text>
                <Animated.View
                  style={[
                    styles.bar,
                    {
                      height: drivenBarAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, Math.min(getPercentage(moodStats.driven) * scaleHeight(1.1), scaleHeight(110))],
                      }),
                      backgroundColor: moodColors.driven,
                    },
                  ]}
                />
              </View>
            </View>

            <Text style={styles.tasksText}>{totalTasks} Tasks completed</Text>

            {}
            <TouchableOpacity onPress={onShare}>
              <Image
                source={require('../assets/share_my.png')}
                style={styles.shareImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default StatisticScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: scaleHeight(60),
    paddingBottom: scaleHeight(70), 
  },
  container: {
    alignItems: 'center',
    width: '100%', 
  },
  topHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: scaleHeight(20),
    paddingHorizontal: scaleWidth(20),
  },
  headerBackground: {
    height: scaleHeight(70),
    backgroundColor: 'rgba(255,255,255,0.2)',
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
  resetStatsButton: {
    width: scaleWidth(70),
    height: scaleHeight(70),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scaleWidth(35),
  },
  resetStatsButtonIcon: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  fullImage: {
    width: width * 0.9,
    height: height * 0.30, 
    marginBottom: scaleHeight(20),
  },
  statsCard: {
    width: width * 0.9,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: scaleWidth(20),
    padding: scaleWidth(20),
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: responsiveFontSize(20),
    color: 'white',
    fontWeight: 'bold',
    marginBottom: scaleHeight(12),
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    width: '100%',
    height: scaleHeight(140),
    marginBottom: scaleHeight(16),
  },
  chartItem: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  percentText: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    marginBottom: scaleHeight(6),
  },
  bar: {
    width: scaleWidth(40),
    borderRadius: scaleWidth(10),
  },
  tasksText: {
    fontSize: responsiveFontSize(16),
    color: 'white',
    marginBottom: scaleHeight(12),
  },
  shareImage: {
    width: scaleWidth(150),
    height: scaleHeight(50),
  },
});