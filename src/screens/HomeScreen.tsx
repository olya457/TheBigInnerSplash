import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
  Platform,
  StatusBar,
  ScrollView,
  Animated, 
  Easing,   
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  MainTabs: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const questions = [
  {
    answers: [
      { text: '☕ A slow start with tea and journaling', type: 'soul' },
      { text: '🏃‍♂️ A run, goals review, and ready to hustle', type: 'spark' },
      { text: '🎶 Music on, no plan, just flow', type: 'seeker' },
    ],
  },
  {
    answers: [
      { text: '🌲 I retreat, reflect, and find stillness', type: 'soul' },
      { text: '💥 I push through and stay productive', type: 'spark' },
      { text: '🌧 I ride the wave of emotions and let it pass', type: 'seeker' },
    ],
  },
  {
    answers: [
      { text: '🌿 A quiet cabin in the woods', type: 'soul' },
      { text: '🌆 A bustling city full of ambition', type: 'spark' },
      { text: '🌊 A beach with crashing waves and open skies', type: 'seeker' },
    ],
  },
  {
    answers: [
      { text: '⚖️ Balance and well-being', type: 'soul' },
      { text: '🎯 Goals and achievement', type: 'spark' },
      { text: '✨ Feeling and inspiration', type: 'seeker' },
    ],
  },
];

const questionImages = [
  require('../assets/image_question1.png'),
  require('../assets/image_question2.png'),
  require('../assets/image_question3.png'),
  require('../assets/image_question4.png'),
];

const cardImages = [
  require('../assets/group1.png'),
  require('../assets/group2.png'),
  require('../assets/group3.png'),
  require('../assets/group4.png'),
];

const HomeScreen = () => {
  const [step, setStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);

  const navigation = useNavigation<HomeScreenNavigationProp>();

  const fadeAnim = useRef(new Animated.Value(0)).current; 
  const slideAnim = useRef(new Animated.Value(50)).current; 
  const questionFade = useRef(new Animated.Value(0)).current; 
  const resultFade = useRef(new Animated.Value(0)).current; 
  const answerScale = useRef(new Animated.Value(1)).current; 

  useEffect(() => {
    if (step === 0) {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [step]);

  useEffect(() => {
    if (step >= 1 && step <= 4) {
      questionFade.setValue(0);
      Animated.timing(questionFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [step]);

  useEffect(() => {
    if (step === 5) {
      resultFade.setValue(0);
      Animated.timing(resultFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();

      const type = getResultType();
      AsyncStorage.setItem('quizResult', type)
        .then(() => console.log('Quiz result saved:', type))
        .catch((error) => console.error('Error saving quiz result:', error));
    }
  }, [step]); 

  const handleSelect = (index: number) => {
    setSelectedAnswer(index);
    answerScale.setValue(1); 
    Animated.sequence([
      Animated.timing(answerScale, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(answerScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleOk = () => {
    if (selectedAnswer === null) return;
    const answerType = questions[step - 1].answers[selectedAnswer].type;
    setAnswers([...answers, answerType]);
    setSelectedAnswer(null);

    Animated.timing(questionFade, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setStep(step + 1);
    });
  };

  const restartQuiz = () => {
    Animated.timing(resultFade, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setStep(0);
      setSelectedAnswer(null);
      setAnswers([]);
    });
  };

  const handleStart = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50, 
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(1);
    });
  };

  const getResultType = (): 'soul' | 'spark' | 'seeker' => {
    const counts = { soul: 0, spark: 0, seeker: 0 };
    answers.forEach((type) => {
      counts[type as keyof typeof counts]++;
    });
    const max = Math.max(counts.soul, counts.spark, counts.seeker);
    if (counts.soul === max && counts.soul > 0) return 'soul';
    if (counts.spark === max && counts.spark > 0) return 'spark';
    if (counts.seeker === max && counts.seeker > 0) return 'seeker';
    return 'seeker'; 
  };

  const resultType = getResultType();

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
    >
      {}
      {step === 0 && (
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Animated.Image
            source={require('../assets/image_big.png')}
            style={styles.topImage}
            resizeMode="contain"
          />
          <View style={styles.cardContainer}>
            <Image
              source={require('../assets/image_hom.png')}
              style={styles.card}
              resizeMode="contain"
            />
            <TouchableOpacity onPress={handleStart} style={styles.buttonWrapper}>
              <Image
                source={require('../assets/let_go.png')}
                style={styles.button}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {}
      {step >= 1 && step <= 4 && (
        <Animated.View style={[styles.quizContainer, { opacity: questionFade }]}>
          <Image
            source={questionImages[step - 1]}
            style={styles.questionImage}
            resizeMode="contain"
          />
          <View style={styles.cardWithAnswers}>
            <Image
              source={cardImages[step - 1]}
              style={styles.quizCard}
              resizeMode="contain"
            />
            <View style={styles.answersInsideCard}>
              {questions[step - 1].answers.map((answer, index) => (
                <Animated.View
                  key={index}
                  style={{ transform: [{ scale: selectedAnswer === index ? answerScale : 1 }] }}
                >
                  <TouchableOpacity
                    style={[
                      styles.answerCard,
                      selectedAnswer === index && styles.selectedAnswer,
                    ]}
                    onPress={() => handleSelect(index)}
                  >
                    <Text style={styles.answerText}>{answer.text}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
              <TouchableOpacity
                onPress={handleOk}
                disabled={selectedAnswer === null}
              >
                <Image
                  source={require('../assets/button_ok.png')}
                  style={[
                    styles.okButton,
                    { opacity: selectedAnswer !== null ? 1 : 0.4 },
                  ]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {}
      {step === 5 && (
        <Animated.ScrollView
          contentContainerStyle={styles.resultContainer}
          showsVerticalScrollIndicator={false}
          style={{ opacity: resultFade }}
        >
          <Image
            source={require('../assets/image_result.png')}
            style={styles.resultHeaderImage}
            resizeMode="contain"
          />
          <Image
            source={
              resultType === 'soul'
                ? require('../assets/soul.png')
                : resultType === 'spark'
                ? require('../assets/spark.png')
                : require('../assets/seeker.png')
            }
            style={styles.resultImage}
            resizeMode="contain"
          />
          {}
          <TouchableOpacity onPress={() => navigation.navigate('MainTabs')} style={styles.nextButton}>
            <Image
              source={require('../assets/imadge_next.png')}
              style={styles.nextImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          {}
          <TouchableOpacity onPress={restartQuiz} style={styles.restartButton}>
            <Image
              source={require('../assets/restart_quiz.png')}
              style={styles.restartImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Animated.ScrollView>
      )}
    </ImageBackground>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: height * 0.05,
    paddingBottom: height * 0.05,
  },
  topImage: {
    width: width * 0.9,
    aspectRatio: 381 / 381,
    marginBottom: -height * 0.18,
    zIndex: 2,
  },
  cardContainer: {
    width: width * 0.9,
    aspectRatio: 367 / 388,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  card: {
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  buttonWrapper: {
    position: 'absolute',
    top: '75%',
    zIndex: 2,
  },
  button: {
    width: width * 0.5,
    aspectRatio: 203 / 66,
  },
  quizContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : height * 0.06,
    paddingHorizontal: width * 0.05,
  },
  questionImage: {
    width: width * 0.9,
    aspectRatio: 367 / 70,
    alignSelf: 'center',
    marginBottom: height * 0.02,
  },
  cardWithAnswers: {
    width: width * 0.9,
    aspectRatio: 367 / 469,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizCard: {
    width: '100%',
    height: '100%',
  },
  answersInsideCard: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: height * 0.015,
  },
  answerCard: {
    width: width * 0.8,
    minHeight: height * 0.06,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.03,
  },
  selectedAnswer: {
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  answerText: {
    color: '#000',
    fontSize: width * 0.04,
    textAlign: 'center',
  },
  okButton: {
    width: width * 0.4,
    aspectRatio: 164 / 49,
    marginTop: height * 0.02,
  },
  resultContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: height * 0.06,
    paddingBottom: height * 0.04,
  },
  resultHeaderImage: {
    width: width * 0.9,
    aspectRatio: 367 / 70,
    marginBottom: height * 0.03,
  },
  resultImage: {
    width: width * 0.9,
    aspectRatio: 367 / 441,
    marginBottom: height * 0.04,
  },
  nextButton: {
    marginBottom: height * 0.02,
  },
  nextImage: {
    width: width * 0.35,
    aspectRatio: 138 / 66,
  },
  restartButton: {
  },
  restartImage: {
    width: width * 0.7,
    aspectRatio: 286 / 66,
  },
});