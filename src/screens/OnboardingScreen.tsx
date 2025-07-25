import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated, 
  ImageBackground,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootStackParamList';

const { width, height } = Dimensions.get('window');

const bottomCards = [
  require('../assets/imadge_welcome.png'),
  require('../assets/imadge_welcome2.png'),
  require('../assets/imadge_welcome3.png'),
  require('../assets/imadge_welcome4.png'),
];

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

const OnboardingScreen = ({ navigation }: OnboardingScreenProps) => {
  const [index, setIndex] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02, 
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500, 
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]); 

  const handleNext = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9, 
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (index < bottomCards.length - 1) {
        setIndex(index + 1); 
        scaleAnim.setValue(1.1); 
        fadeAnim.setValue(0);  

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1, 
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        navigation.replace('Home');
      }
    });
  };

  return (
    <Animated.View style={[styles.flex, { transform: [{ scale: pulseAnim }] }]}>
      <ImageBackground
        source={require('../assets/background.png')}
        style={styles.background}
      >
        <View style={styles.content}>
          {}
          <Animated.Image
            source={require('../assets/image_big.png')}
            style={[styles.topImage, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
            resizeMode="contain"
          />

          {}
          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <Image source={bottomCards[index]} style={styles.cardImage} resizeMode="contain" />
          </Animated.View>

          {}
          {}
          <Animated.View style={[styles.nextButtonContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity onPress={handleNext}>
              <Image
                source={require('../assets/imadge_next.png')}
                style={styles.nextButton}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ImageBackground>
    </Animated.View>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  background: {
    flex: 1,
    resizeMode: 'cover',
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: height * 0.1,
    paddingBottom: 20,        
    overflow: 'hidden',     
  },
  topImage: {
    width: width * 0.9,
    aspectRatio: 1,
    maxHeight: height * 0.45,
  },
  card: {
    width: width * 0.9,
    height: width * 0.9 * (199 / 367), 
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', 
    marginTop: 20,
    marginBottom: 20,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  nextButtonContainer: {
    marginTop: 0, 
    marginBottom: -50,
  },
  nextButton: {
    width: width * 0.45,
    height: width * 0.45 * (66 / 166),
  },
});