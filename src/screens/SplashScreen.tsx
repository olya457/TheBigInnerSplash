import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
  Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootStackParamList';


type SplashScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }: SplashScreenProps) => {
  const [step, setStep] = useState<'spinner' | 'image'>('spinner');
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgPulse, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(bgPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const toImageTimer = setTimeout(() => {
      setStep('image');

      Animated.timing(scaleAnim, {
        toValue: 1.8,
        duration: 5000,
        useNativeDriver: true,
      }).start();

      const toNext = setTimeout(() => {
        navigation.replace('Onboarding');
      }, 5500);

      return () => clearTimeout(toNext);
    }, 3000);

    return () => clearTimeout(toImageTimer);
  }, []);

  return (
    <View style={styles.container}>
      {}
      <Animated.Image
        source={require('../assets/background.png')}
        style={[
          styles.background,
          { transform: [{ scale: bgPulse }] },
        ]}
        resizeMode="cover"
      />

      {}
      {step === 'spinner' ? (
        <WebView
          originWhitelist={['*']}
          style={styles.webview}
          scrollEnabled={false}
          source={{
            html: `
              <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  html, body {
                    margin: 0;
                    padding: 0;
                    background: transparent;
                    height: 100%;
                    overflow: hidden;
                  }

                  .container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                  }

                  .circle {
                    width: 200px;
                    height: 200px;
                    border-radius: 100px;
                    border: 8px solid #ccc;
                    border-top-color: #3498db;
                    animation: spin 4s linear infinite;
                    position: relative;
                    box-sizing: border-box;
                    overflow: hidden;
                  }

                  .circle svg {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 180px;
                    height: 180px;
                    animation: rotate 6s linear infinite;
                  }

                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }

                  @keyframes rotate {
                    0% { transform: translate(-50%, -50%) rotate(0deg); }
                    100% { transform: translate(-50%, -50%) rotate(360deg); }
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="circle">
                    <svg viewBox="0 0 24 24" fill="#3498db">
                      <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 
                        1.2-1.6 2.6-2.2 4.2-1.8 
                        .913.228 1.565.89 2.288 1.624 
                        C13.666 10.618 15.027 12 18.001 12 
                        c3.2 0 5.2-1.6 6-4.8 
                        -1.2 1.6-2.6 2.2-4.2 1.8 
                        -.913-.228-1.565-.89-2.288-1.624 
                        C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2 
                        c-3.2 0-5.2 1.6-6 4.8 
                        1.2-1.6 2.6-2.2 4.2-1.8 
                        .913.228 1.565.89 2.288 1.624 
                        1.177 1.194 2.538 2.576 5.512 2.576 
                        3.2 0 5.2-1.6 6-4.8 
                        -1.2 1.6-2.6 2.2-4.2 1.8 
                        -.913-.228-1.565-.89-2.288-1.624 
                        C10.337 13.382 8.976 12 6.001 12z"/>
                    </svg>
                  </div>
                </div>
              </body>
              </html>
            `,
          }}
        />
      ) : (
        <Animated.Image
          source={require('../assets/image_big.png')}
          style={[
            styles.image,
            { transform: [{ scale: scaleAnim }] },
          ]}
          resizeMode="contain"
        />
      )}
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width,
    height,
  },
  webview: {
    width: 200,
    height: 200,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  image: {
    width: 211,
    height: 211,
    zIndex: 2,
  },
});
