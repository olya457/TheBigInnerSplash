import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  Platform,
  Dimensions,
  ScrollView,
  Animated, 
  Easing, 
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Share from 'react-native-share';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  affirmations,
  tasksByCategory,
  CategoryKey,
} from '../data/TaskData';

type TaskStage = 'task1' | 'task2_affirmation' | 'task3_mood_selection' | 'task3_finished_ritual';

const { width, height } = Dimensions.get('window'); 

const baseWidth = 375; 
const scale = width / baseWidth;

const responsiveFontSize = (size: number) => Math.round(size * scale);
const responsiveHeight = (size: number) => Math.round(size * scale);
const responsiveWidth = (size: number) => Math.round(size * scale);


const ProfileScreen = ({ navigation }: any) => {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-GB').replace(/\//g, '.');

  const [task, setTask] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); 
  const [showFinishButton, setShowFinishButton] = useState(false);
  const [affirmation, setAffirmation] = useState('');
  const [currentCategory, setCurrentCategory] = useState<CategoryKey>('grounded');
  const [currentStage, setCurrentStage] = useState<TaskStage>('task1'); 
  const [isSaved, setIsSaved] = useState(false);

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodSelectionFinished, setMoodSelectionFinished] = useState(false); 

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const moodScale = useRef(new Animated.Value(1)).current;

  const selectRandomTaskAndCategory = () => {
    const categoryKeys = Object.keys(tasksByCategory) as CategoryKey[];
    const randomCategoryKey = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];

    const tasksForCategory = tasksByCategory[randomCategoryKey];
    const selectedTask = tasksForCategory[Math.floor(Math.random() * tasksForCategory.length)];

    return { selectedTask, categoryKey: randomCategoryKey };
  };

  useEffect(() => {
    const { selectedTask, categoryKey } = selectRandomTaskAndCategory();
    setTask(selectedTask);
    setCurrentCategory(categoryKey);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => Math.max(prev - 1, 0));
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) {
      setIsTimerRunning(false);
      setShowFinishButton(true);
    }
  }, [timeLeft]);

  useEffect(() => {
    const checkIfSaved = async () => {
      if (!affirmation) {
        setIsSaved(false);
        return;
      }
      try {
        const saved = await AsyncStorage.getItem('savedAffirmations');
        const savedArray = saved ? JSON.parse(saved) : [];
        setIsSaved(savedArray.includes(affirmation));
      } catch (error) {
        console.error('Error checking saved affirmations:', error);
      }
    };
    checkIfSaved();
  }, [affirmation]);

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [currentStage]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const resetAll = () => {
    const { selectedTask, categoryKey } = selectRandomTaskAndCategory();
    setTask(selectedTask);
    setCurrentCategory(categoryKey);

    setTimeLeft(300);
    setIsTimerRunning(false);
    setShowFinishButton(false);
    setAffirmation('');
    setCurrentStage('task1'); 
    setIsSaved(false);
    setSelectedMood(null);
    setMoodSelectionFinished(false); 
  };

  const handleShare = async () => {
    try {
      await Share.open({
        message: `My daily affirmation: ${affirmation}`,
        title: 'Share Affirmation',
      });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'message' in error) {
        const errMessage = (error as { message: string }).message;
        if (errMessage === 'User did not share') {
          console.log('Share cancelled by user.');
        } else {
          console.error('Error sharing:', errMessage);
        }
      } else {
        console.error('Unexpected error during sharing:', error);
      }
    }
  };

  const handleSaveAffirmation = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedAffirmations');
      const savedArray = saved ? JSON.parse(saved) : [];

      if (!savedArray.includes(affirmation)) {
        savedArray.push(affirmation);
        await AsyncStorage.setItem('savedAffirmations', JSON.stringify(savedArray));
        setIsSaved(true);
        console.log('Affirmation saved!');
      } else {
        console.log('Already saved.');
      }
    } catch (error) {
      console.error('Save affirmation error:', error);
    }
  };

  const goToTask2Affirmation = () => {
    setAffirmation(
      affirmations[currentCategory][
        Math.floor(Math.random() * affirmations[currentCategory].length)
      ]
    );
    setCurrentStage('task2_affirmation');
  };

  const goToTask3MoodSelection = () => {
    setCurrentStage('task3_mood_selection');
    setSelectedMood(null);
    setMoodSelectionFinished(false);
  };

  const moodOptions = [
    { label: 'Calm & Centered', color: '#6BFF81', key: 'grounded' },
    { label: 'Driven & Focused', color: '#FEE101', key: 'driven' },
    { label: 'Emotional & Flowing', color: '#FF7997', key: 'flow' },
  ];

  const handleMoodPress = (moodKey: string) => {
    setSelectedMood(moodKey);
    moodScale.setValue(1);
    Animated.sequence([
      Animated.timing(moodScale, { toValue: 1.05, duration: 100, useNativeDriver: true }), 
      Animated.timing(moodScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleSaveMood = async () => {
    if (selectedMood) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const moodEntry = { date: today, mood: selectedMood };
        await AsyncStorage.setItem(`mood_${today}`, JSON.stringify(moodEntry));
        console.log('Selected Mood saved:', selectedMood);
        setMoodSelectionFinished(true);
        setCurrentStage('task3_finished_ritual');
      } catch (error) {
        console.error('Failed to save mood:', error);
      }
    }
  };

  const handleRollMoodWheel = () => {
    console.log("Navigating to Statistic screen or similar...");
    navigation.navigate('Statistic');
    resetAll();
  };

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      {}
      <View style={styles.topRightContainer}>
        <View style={styles.dateBox}>
          <Image
            source={require('../assets/image_photoroom.png')}
            style={styles.rightImage}
          />
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={resetAll}>
          <Image
            source={require('../assets/button.png')}
            style={styles.buttonImage}
          />
        </TouchableOpacity>
      </View>

      {}
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.content}>
          {}
          <Animated.View
            style={[
              currentStage === 'task3_mood_selection' || currentStage === 'task3_finished_ritual'
                ? styles.moodCardContainer
                : styles.taskCardContainer,
              { opacity: fadeAnim },
            ]}
          >
            {currentStage === 'task1' && (
              <>
                <Text style={styles.cardTitle} numberOfLines={1} adjustsFontSizeToFit>
                  YOUR DAILY TASK
                </Text>
                <Text style={styles.cardText} numberOfLines={2} adjustsFontSizeToFit>
                  {task}
                </Text>

                {!isTimerRunning && !showFinishButton && (
                  <TouchableOpacity onPress={() => setIsTimerRunning(true)}>
                    <Image
                      source={require('../assets/start_task.png')}
                      style={styles.startTaskImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}

                {isTimerRunning && (
                  <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                )}

                {showFinishButton && (
                  <TouchableOpacity onPress={goToTask2Affirmation}>
                    <Image
                      source={require('../assets/finish_next.png')}
                      style={styles.startTaskImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}
              </>
            )}

            {currentStage === 'task2_affirmation' && (
              <>
                <Text style={styles.cardTitle} numberOfLines={1} adjustsFontSizeToFit>
                  YOUR DAILY AFFIRMATION
                </Text>
                <Text style={styles.cardText} numberOfLines={2} adjustsFontSizeToFit>
                  {affirmation}
                </Text>

                <View style={styles.affirmationButtonRow}>
                  <TouchableOpacity onPress={handleSaveAffirmation}>
                    <Image
                      source={
                        isSaved
                          ? require('../assets/icon_saved_highlighted.png')
                          : require('../assets/icon_save.png')
                      }
                      style={styles.actionIcon}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={goToTask3MoodSelection}>
                    <Image
                      source={require('../assets/imadge_next.png')}
                      style={styles.nextButtonImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleShare}>
                    <Image
                      source={require('../assets/icon_share.png')}
                      style={styles.actionIcon}
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {currentStage === 'task3_mood_selection' && (
              <>
                <Text style={styles.moodTitle}>CHOOSE YOUR MOOD</Text>

                {moodOptions.map((mood) => (
                  <Animated.View
                    key={mood.key}
                    style={{
                      transform: selectedMood === mood.key ? [{ scale: moodScale }] : [{ scale: 1 }],
                      width: '100%', 
                      alignItems: 'center',
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.moodOption,
                        { backgroundColor: mood.color },
                        selectedMood === mood.key && styles.selectedBorder,
                      ]}
                      onPress={() => handleMoodPress(mood.key)}
                    >
                      <Text style={styles.moodText}>{mood.label}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}

                <TouchableOpacity
                  style={selectedMood ? styles.saveButtonActive : styles.saveButtonPassive}
                  onPress={handleSaveMood}
                  disabled={!selectedMood}
                >
                  <Image
                    source={
                      selectedMood
                        ? require('../assets/save_active.png')
                        : require('../assets/save_passive.png')
                    }
                    style={styles.saveImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </>
            )}

            {currentStage === 'task3_finished_ritual' && (
              <View style={styles.finishedRitualContainer}>
                <Text style={styles.finishedTitle}>YOU'RE FINISHED YOUR DAILY RITUAL</Text>
                <Text style={styles.subtitle}>Roll the mood wheel</Text>

                <TouchableOpacity onPress={handleRollMoodWheel}>
                  <Image
                    source={require('../assets/ok_roll.png')}
                    style={styles.rollImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {}
          <View
            style={[
              styles.indicatorContainer,
              (currentStage === 'task3_mood_selection' || currentStage === 'task3_finished_ritual') && {
                marginTop: responsiveFontSize(30),
              },
            ]}
          >
            <View style={[styles.indicator, currentStage === 'task1' && styles.indicatorActive]}>
              <Text style={currentStage === 'task1' ? styles.indicatorTextActive : styles.indicatorText}>1</Text>
            </View>
            <View style={[styles.indicator, currentStage === 'task2_affirmation' && styles.indicatorActive]}>
              <Text style={currentStage === 'task2_affirmation' ? styles.indicatorTextActive : styles.indicatorText}>2</Text>
            </View>
            <View style={[styles.indicator, (currentStage === 'task3_mood_selection' || currentStage === 'task3_finished_ritual') && styles.indicatorActive]}>
              <Text style={(currentStage === 'task3_mood_selection' || currentStage === 'task3_finished_ritual') ? styles.indicatorTextActive : styles.indicatorText}>3</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  topRightContainer: {
    position: 'absolute',
    top: height * 0.07,
    right: width * 0.05,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  dateBox: {
    flex: 1,
    maxWidth: width * 0.65,
    height: responsiveFontSize(70),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: responsiveFontSize(16),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveFontSize(16),
    marginRight: responsiveFontSize(12),
  },
  rightImage: {
    width: responsiveFontSize(70),
    height: responsiveFontSize(70),
    resizeMode: 'contain',
    marginRight: responsiveFontSize(12),
  },
  dateText: {
    flex: 1,
    fontSize: responsiveFontSize(20),
    color: '#fff',
    fontWeight: '600',
    flexWrap: 'wrap',
    textShadowColor: 'rgba(0, 0, 0, 0.95)', 
    textShadowOffset: { width: -1, height: 1 }, 
    textShadowRadius: 2, 
  },
  button: {
    width: responsiveFontSize(72),
    height: responsiveFontSize(72),
    borderRadius: responsiveFontSize(36),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: height * 0.15,
    paddingBottom: height * 0.05,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCardContainer: {
    backgroundColor: '#58c6c6',
    paddingVertical: responsiveFontSize(24),
    paddingHorizontal: responsiveFontSize(20),
    marginHorizontal: width * 0.05,
    borderRadius: responsiveFontSize(24),
    width: '90%',
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: responsiveFontSize(40),
    minHeight: height * 0.4,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: responsiveFontSize(12),
  },
  cardText: {
    fontSize: responsiveFontSize(16),
    fontStyle: 'italic',
    color: '#fff',
    textAlign: 'center',
    lineHeight: responsiveFontSize(24),
    marginBottom: responsiveFontSize(24),
  },
  startTaskImage: {
    width: responsiveFontSize(251),
    height: responsiveFontSize(66),
    marginTop: responsiveFontSize(16),
  },
  timerText: {
    fontSize: responsiveFontSize(28),
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: responsiveFontSize(12),
  },
  affirmationButtonRow: {
    flexDirection: 'row',
    marginTop: responsiveFontSize(10),
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsiveFontSize(8),
    flexWrap: 'wrap',
  },
  actionIcon: {
    width: responsiveFontSize(48),
    height: responsiveFontSize(48),
  },
  nextButtonImage: {
    width: responsiveFontSize(170),
    height: responsiveFontSize(66),
  },

  moodCardContainer: {
    backgroundColor: '#58c6c6',
    paddingVertical: responsiveFontSize(24),
    paddingHorizontal: responsiveFontSize(20),
    marginHorizontal: width * 0.05,
    borderRadius: responsiveFontSize(24),
    width: '90%',
    alignSelf: 'center',
    alignItems: 'center',
    minHeight: responsiveHeight(350),
    justifyContent: 'center',
    marginBottom: responsiveFontSize(20),
  },
  moodTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: 'bold',
    color: '#000',
    marginBottom: responsiveFontSize(20),
  },
  moodOption: {
    width: '90%',
    maxWidth: responsiveFontSize(330),
    height: responsiveFontSize(68),
    borderRadius: responsiveFontSize(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveFontSize(12),
  },
  selectedBorder: {
    borderWidth: responsiveFontSize(3),
    borderColor: 'red',
  },
  moodText: {
    fontSize: responsiveFontSize(18),
    fontWeight: 'bold',
    color: 'black',
  },
  saveButtonPassive: {
    marginTop: responsiveFontSize(15),
  },
  saveButtonActive: {
    marginTop: responsiveFontSize(15),
  },
  saveImage: {
    width: responsiveFontSize(200),
    height: responsiveFontSize(60),

  },

  finishedRitualContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsiveFontSize(15),
  },
  finishedTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: responsiveFontSize(10),
  },
  subtitle: {
    fontSize: responsiveFontSize(16),
    color: '#000',
    textAlign: 'center',
    marginBottom: responsiveFontSize(25),
  },
  rollImage: {
    width: responsiveFontSize(220),
    height: responsiveFontSize(60),
  },

  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: responsiveFontSize(20),
    paddingBottom: height * 0.03,
  },
  indicator: {
    width: responsiveFontSize(50),
    height: responsiveFontSize(50),
    borderRadius: responsiveFontSize(25),
    backgroundColor: '#6EC9DF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorActive: {
    backgroundColor: '#F6921E',
  },
  indicatorText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: responsiveFontSize(18),
  },
  indicatorTextActive: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: responsiveFontSize(18),
  },
  newTaskButton: {
    marginTop: responsiveFontSize(20),
    backgroundColor: '#F6921E',
    paddingVertical: responsiveFontSize(12),
    paddingHorizontal: responsiveFontSize(30),
    borderRadius: responsiveFontSize(25),
  },
  newTaskButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: responsiveFontSize(16),
  },
});