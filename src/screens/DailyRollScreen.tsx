import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
  Image,
  Animated,
  Share,
  PermissionsAndroid,
  Platform,
  Alert,
  PixelRatio,
} from 'react-native';
import RNFS from 'react-native-fs';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';

const { width, height } = Dimensions.get('window');

const BASE_WIDTH = 414;
const BASE_HEIGHT = 896; 

const scaleWidth = (size: number) => (width / BASE_WIDTH) * size;
const scaleHeight = (size: number) => (height / BASE_HEIGHT) * size;
const responsiveFontSize = (size: number) => {
  const fontScale = PixelRatio.getFontScale();
  return size / fontScale;
};
const slotImages = [
  require('../assets/slot_image1.png'), 
  require('../assets/slot_image2.png'), 
  require('../assets/slot_image3.png'), 
];

const abstractImages = [
  require('../assets/unsplash_E8Ufcyz514.png'),
  require('../assets/unsplash_E8U.png'),
  require('../assets/unsplash_E.png'),
];

const getRandomIndex = () => Math.floor(Math.random() * slotImages.length);

const DailyRollScreen = () => {
  const bubbleCount = 25; 
  const [rolling, setRolling] = useState(false); 

  const [slot1Image, setSlot1Image] = useState(slotImages[0]);
  const [slot2Image, setSlot2Image] = useState(slotImages[1]);
  const [slot3Image, setSlot3Image] = useState(slotImages[2]);

  const [modalVisible, setModalVisible] = useState(false); 
  const [prizeType, setPrizeType] = useState<'story' | 'wallpaper' | 'abstract' | null>(null); 
  const [randomAbstract, setRandomAbstract] = useState(abstractImages[0]); 
  const [landedSlotImage, setLandedSlotImage] = useState(slotImages[0]); 

  const [spinAttempt, setSpinAttempt] = useState(0); 
  const [rollButtonText, setRollButtonText] = useState('ROLL'); 
  const [forcedWinIndex, setForcedWinIndex] = useState<number | null>(null); 

  const [backgroundImage, setBackgroundImage] = useState(require('../assets/background_game.png'));

  const intervalRefs = useRef<{ [key: string]: any }>({});

  const bubbleAnimations = useRef(
    [...Array(bubbleCount)].map(() => ({
      translateY: new Animated.Value(height + Math.random() * height),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    bubbleAnimations.forEach(({ translateY, opacity }) => {
      const size = Math.random() * scaleWidth(20) + scaleWidth(10); 
      const duration = Math.random() * 4000 + 3000;
      const delay = Math.random() * 5000;

      const animate = () => {
        translateY.setValue(height + size);
        opacity.setValue(1);
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -scaleHeight(50), 
            duration,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration,
            delay,
            useNativeDriver: true,
          }),
        ]).start(() => animate()); 
      };
      animate(); 
    });
  }, []); 

  const onShare = async (title: string, message: string, url?: string) => {
    try {
      const result = await Share.share({
        title: title,
        message: message + (url ? `\n\n${url}` : ''),
        url: url, 
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log(`Shared via ${result.activityType}`);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error: any) {
      console.error('Error sharing:', error.message);
    }
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      const permission = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES || PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
      const granted = await PermissionsAndroid.request(permission, {
        title: 'Storage Permission Required',
        message: 'App needs access to your storage to download images',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      });
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const saveAbstractImage = async () => {
    try {
      const granted = await requestStoragePermission();
      if (!granted) {
        Alert.alert('Permission Denied', 'Cannot save image without storage permission.');
        return;
      }

      const asset = Image.resolveAssetSource(randomAbstract);
      let sourceUri = asset.uri;

      if (!sourceUri) {
        Alert.alert('Error', 'Asset URI not found.');
        return;
      }

      const fileName = `abstract_${Date.now()}.png`;
      const destPath = `${RNFS.TemporaryDirectoryPath}/${fileName}`;

      if (Platform.OS === 'ios') {
        const response = await fetch(sourceUri);
        const imageBlob = await response.blob();

        const reader = new FileReader();
        reader.readAsDataURL(imageBlob);

        await new Promise<void>((resolve, reject) => {
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              const base64Data = reader.result.split(',')[1];
              RNFS.writeFile(destPath, base64Data, 'base64')
                .then(() => {
                  sourceUri = destPath;
                  resolve();
                })
                .catch(reject);
            } else {
              reject(new Error('Failed to convert blob to base64.'));
            }
          };
          reader.onerror = reject;
        });

      } else if (Platform.OS === 'android') {
        const assetPathInBundle = sourceUri.replace('file:///android_asset/', '');
        await RNFS.copyFileAssets(assetPathInBundle, destPath);
        sourceUri = destPath;
      }

      await CameraRoll.save(sourceUri, { type: 'photo' });

      console.log('✅ Image saved to gallery');
      Alert.alert('Success', 'Image saved to gallery!');
    } catch (error: any) {
      console.error('❌ Error saving image:', error.message);
      if (Platform.OS === 'ios' && error.message.includes('PHPhotosErrorDomain error -1')) {
        Alert.alert(
          'Permission Denied',
          'Please grant photo library access in your device settings to save images. Go to Settings > Privacy & Security > Photos > [Your App Name] and allow access.'
        );
      } else {
        Alert.alert('Error', `Failed to save image: ${error.message}`);
      }
    }
  };

  const handleRoll = () => {
    if (rolling) return;
    setRolling(true);
    setModalVisible(false);
    setRollButtonText('ROLL');
    setSpinAttempt(prev => prev + 1);

    const shouldForceWin = spinAttempt >= 1;
    const finalResultIndexForForcedWin = getRandomIndex();

    if (shouldForceWin) {
      setForcedWinIndex(finalResultIndexForForcedWin);
    } else {
      setForcedWinIndex(null);
    }

    intervalRefs.current.slot1 = setInterval(() => {
      setSlot1Image(slotImages[getRandomIndex()]);
    }, 60);

    intervalRefs.current.slot2 = setInterval(() => {
      setSlot2Image(slotImages[getRandomIndex()]);
    }, 70);

    intervalRefs.current.slot3 = setInterval(() => {
      setSlot3Image(slotImages[getRandomIndex()]);
    }, 90);

    setTimeout(() => {
      clearInterval(intervalRefs.current.slot1);
      setSlot1Image(shouldForceWin ? slotImages[finalResultIndexForForcedWin] : slotImages[getRandomIndex()]);
    }, 1500);

    setTimeout(() => {
      clearInterval(intervalRefs.current.slot2);
      setSlot2Image(shouldForceWin ? slotImages[finalResultIndexForForcedWin] : slotImages[getRandomIndex()]);
    }, 2000);

    setTimeout(() => {
      clearInterval(intervalRefs.current.slot3);
      const finalSlot3Image = shouldForceWin ? slotImages[finalResultIndexForForcedWin] : slotImages[getRandomIndex()];
      setSlot3Image(finalSlot3Image);

      const currentFinalSlot1Image = shouldForceWin ? slotImages[finalResultIndexForForcedWin] : slot1Image;
      const currentFinalSlot2Image = shouldForceWin ? slotImages[finalResultIndexForForcedWin] : slot2Image;
      const currentFinalSlot3Image = finalSlot3Image;

      if (currentFinalSlot1Image === currentFinalSlot2Image && currentFinalSlot2Image === currentFinalSlot3Image) {
        setLandedSlotImage(currentFinalSlot3Image);

        let matchedIndex = forcedWinIndex;
        if (matchedIndex === null) {
          matchedIndex = slotImages.findIndex(img => img === currentFinalSlot3Image);
        }

        if (matchedIndex === 0) {
          setPrizeType('story');
        } else if (matchedIndex === 1) {
          setPrizeType('wallpaper');
        } else {
          setPrizeType('abstract');
          setRandomAbstract(abstractImages[Math.floor(Math.random() * abstractImages.length)]);
        }
        setModalVisible(true);
        setSpinAttempt(0);
        setRollButtonText('ROLL');
      } else {
        setRollButtonText('TRY AGAIN');
      }

      setRolling(false);
    }, 2500);
  };

  const handleReset = () => {
    console.log('Reset button pressed');
    setModalVisible(false);
    setSpinAttempt(0);
    setRollButtonText('ROLL');
    setPrizeType(null);
    setRandomAbstract(abstractImages[0]);
    setLandedSlotImage(slotImages[0]);
    setForcedWinIndex(null);
    setSlot1Image(slotImages[0]);
    setSlot2Image(slotImages[1]);
    setSlot3Image(slotImages[2]);
    setBackgroundImage(require('../assets/background_game.png'));
  };

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.background}
      resizeMode="cover"
    >
      {}
      <View style={StyleSheet.absoluteFill}>
        {bubbleAnimations.map(({ translateY, opacity }, index) => {
          const size = Math.random() * scaleWidth(20) + scaleWidth(10); 
          const x = Math.random() * (width - scaleWidth(30)); 
          return (
            <Animated.Image
              key={index}
              source={require('../assets/bubble.png')}
              style={[
                styles.bubble,
                {
                  width: size,
                  height: size,
                  left: x,
                  transform: [{ translateY }],
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>

      {}
      <View style={styles.topOverlay}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>DAILY ROLL</Text>
        </View>
        <TouchableOpacity onPress={handleReset} activeOpacity={0.8}>
          <Image source={require('../assets/button.png')} style={styles.resetButton} />
        </TouchableOpacity>
      </View>

      {}
      <View style={styles.slotsContainer}>
        <Image source={slot1Image} style={styles.slotImage} />
        <View style={styles.separator} />
        <Image source={slot2Image} style={styles.slotImage} />
        <View style={styles.separator} />
        <Image source={slot3Image} style={styles.slotImage} />
      </View>

      {}
      <View style={styles.rollButtonContainer}>
        <TouchableOpacity onPress={handleRoll} activeOpacity={0.8} disabled={rolling}>
          {}
          <View style={styles.rollButtonWrapper}>
            <Image
              source={require('../assets/button_roll.png')}
              style={styles.rollButtonImage}
            />
            {}
            <Text style={styles.rollButtonText}>{rollButtonText}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {}
      {modalVisible && prizeType && (
        <View style={styles.modalOverlay}>
          {}
          {prizeType === 'story' && (
            <View style={styles.modalCard}>
              <Image source={landedSlotImage} style={styles.modalPrizeImage} />
              <Text style={styles.modalTitle}>THE LAST PUSH</Text>
              <Text style={styles.storyText}>
                A young swimmer trained for years to cross a cold, rough channel. On the final swim, fog surrounded her. She gave up. Later she learned — she was only 500 meters from the finish. One week later, she tried again — same fog — but this time she finished. Success often comes one step after you feel like quitting.
              </Text>
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity onPress={() => onShare('Motivational Story: The Last Push', 'Read this inspiring story: "The Last Push" - A young swimmer trained for years... Success often comes one step after you feel like quitting.')}>
                  <Image source={require('../assets/button_share.png')} style={styles.modalBtn} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Image source={require('../assets/button_close.png')} style={styles.modalBtn} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {}
          {prizeType === 'wallpaper' && (
            <View style={styles.modalCard}>
              <Image source={landedSlotImage} style={styles.modalPrizeImage} />
              <Text style={styles.modalTitle}>WALLPAPERS</Text>
              <Image source={require('../assets/background_replacement.png')} style={styles.wallpaperPreview} />
              <TouchableOpacity
                onPress={() => {
                  setBackgroundImage(require('../assets/background_replacement.png'));
                  setModalVisible(false);
                }}
              >
                <Image source={require('../assets/button_equip.png')} style={styles.modalBtn} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Image source={require('../assets/button_close.png')} style={styles.modalBtn} />
              </TouchableOpacity>
            </View>
          )}

          {}
          {prizeType === 'abstract' && (
            <View style={styles.modalCard}>
              <Image source={landedSlotImage} style={styles.modalPrizeImage} />
              <Text style={styles.modalTitle}>ABSTRACT IMAGE</Text>
              <Image source={randomAbstract} style={styles.wallpaperPreview} />
              <TouchableOpacity onPress={saveAbstractImage}>
                <Image source={require('../assets/button_download.png')} style={styles.modalBtn} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Image source={require('../assets/button_close.png')} style={styles.modalBtn} />
                </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%', 
    height: '100%', 
  },
  topOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? scaleHeight(50) : scaleHeight(20), 
    width: '100%', 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20), 
    zIndex: 10,
  },
  titleContainer: {
    width: scaleWidth(232), 
    height: scaleHeight(70), 
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scaleWidth(22), 
    borderWidth: scaleWidth(2), 
    borderColor: 'white',
    marginTop: scaleHeight(20), 
  },
  titleText: {
    color: 'white',
    fontSize: responsiveFontSize(24), 
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 2,
  },
  resetButton: {
    width: scaleWidth(70), 
    height: scaleHeight(70), 
    resizeMode: 'contain',
    marginTop: scaleHeight(20), 
  },
  bubble: {
    position: 'absolute',
    tintColor: 'white',
  },
  slotsContainer: {
    marginTop: height * 0.22, 
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleHeight(12), 
  },
  slotImage: {
    width: scaleWidth(220), 
    height: scaleHeight(130), 
    resizeMode: 'contain',
  },
  separator: {
    width: scaleWidth(280), 
    height: scaleHeight(4), 
    backgroundColor: 'white',
    borderRadius: scaleWidth(2), 
    marginVertical: scaleHeight(4), 
  },
  rollButtonContainer: {
    position: 'absolute',
    bottom: scaleHeight(130), 
    width: '100%',
    alignItems: 'center',
  },
  rollButtonWrapper: {
    width: scaleWidth(160), 
    height: scaleHeight(80), 
    justifyContent: 'center',
    alignItems: 'center',
  },
  rollButtonImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    position: 'absolute',
  },
  rollButtonText: {
    color: 'white',
    fontSize: responsiveFontSize(20), 
    fontWeight: 'bold',
    textTransform: 'uppercase',
    zIndex: 1,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 20,
  },
  modalCard: {
    width: scaleWidth(280), 
    backgroundColor: '#aef1f8',
    borderRadius: scaleWidth(28), 
    paddingVertical: scaleHeight(24), 
    paddingHorizontal: scaleWidth(20), 
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: responsiveFontSize(18), 
    fontWeight: 'bold',
    color: '#333',
    marginBottom: scaleHeight(4), 
    textAlign: 'center',
  },
  storyText: {
    color: '#333',
    fontSize: responsiveFontSize(14), 
    textAlign: 'center',
    marginVertical: scaleHeight(10), 
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaleHeight(20), 
    gap: scaleWidth(12),
  },
  modalBtn: {
    width: scaleWidth(164), 
    height: scaleHeight(66), 
    resizeMode: 'contain',
  },
  modalPrizeImage: { 
    width: scaleWidth(120),
    height: scaleHeight(120),
    marginBottom: scaleHeight(10),
  },
  wallpaperPreview: {
    width: scaleWidth(180),
    height: scaleHeight(140), 
    resizeMode: 'cover',
    marginVertical: scaleHeight(16), 
    borderRadius: scaleWidth(12), 
  },
});

export default DailyRollScreen;