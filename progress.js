// File: progress.js - GAME-RELATED CODE REMOVED
// This file contains all the master logic for English progress tracking.

// ===== PROGRESS INITIALIZATION =====
function initProgress() {
  let progress = localStorage.getItem('linguaKidsProgress');
  
  if (!progress) {
    const defaultProgress = {
      level1: { 
        alphabets: { completed: 0, total: 26 }, 
        numbers: { completed: 0, total: 100 } 
      },
      level2: {
        fruits: { completed: 0, total: 10 }, 
        vegetables: { completed: 0, total: 10 },
        animals: { completed: 0, total: 10 }, 
        birds: { completed: 0, total: 10 },
        vehicles: { completed: 0, total: 10 }, 
        colors: { completed: 0, total: 10 }
      },
      level3: {
        greetings: { completed: 0, total: 10 },
        activities: { completed: 0, total: 10 },
        questions: { completed: 0, total: 5 }
      },
      achievements: {
        firstSteps: false, alphabetMaster: false, numberWhiz: false, wordExpert: false,
        sentenceBuilder: false, weekStreak: false, monthStreak: false
      },
      streak: { count: 0, lastDate: null },
      sessionDate: null
    };
    localStorage.setItem('linguaKidsProgress', JSON.stringify(defaultProgress));
    return defaultProgress;
  }
  
  let progressData = JSON.parse(progress);
  progressData = migrateProgressData(progressData);
  updateStreak(progressData);
  return progressData;
}

// ===== MIGRATE OLD PROGRESS DATA =====
function migrateProgressData(progress) {
  // Ensure all structures exist
  if (!progress.level1) progress.level1 = { 
    alphabets: { completed: 0, total: 26 }, 
    numbers: { completed: 0, total: 100 } 
  };
  
  if (!progress.level2) progress.level2 = { 
    fruits: { completed: 0, total: 10 }, 
    vegetables: { completed: 0, total: 10 },
    animals: { completed: 0, total: 10 }, 
    birds: { completed: 0, total: 10 },
    vehicles: { completed: 0, total: 10 }, 
    colors: { completed: 0, total: 10 } 
  };
  
  if (!progress.level3) progress.level3 = { 
    greetings: { completed: 0, total: 10 }, 
    activities: { completed: 0, total: 10 }, 
    questions: { completed: 0, total: 5 } 
  };
  
  // Remove games data if it exists
  if (progress.games) {
    delete progress.games;
  }
  
  // Remove gameChampion achievement if it exists
  if (progress.achievements && progress.achievements.gameChampion) {
    delete progress.achievements.gameChampion;
  }
  
  if (!progress.achievements) progress.achievements = { 
    firstSteps: false, 
    alphabetMaster: false, 
    numberWhiz: false, 
    wordExpert: false, 
    sentenceBuilder: false, 
    weekStreak: false, 
    monthStreak: false 
  };
  
  if (!progress.streak) progress.streak = { count: 0, lastDate: null };
  
  localStorage.setItem('linguaKidsProgress', JSON.stringify(progress));
  return progress;
}

// ===== CALCULATE OVERALL PROGRESS PERCENTAGE =====
function calculateOverallProgress(progress) {
  if (!progress) return { level1: 0, level2: 0, level3: 0, overall: 0 };
  
  // Calculate Level 1 progress (Alphabets & Numbers)
  const level1Total = progress.level1.alphabets.total + progress.level1.numbers.total;
  const level1Completed = progress.level1.alphabets.completed + progress.level1.numbers.completed;
  const level1Percent = level1Total > 0 ? (level1Completed / level1Total) * 100 : 0;
  
  // Calculate Level 2 progress (Basic Words)
  const level2Categories = Object.values(progress.level2);
  const level2Total = level2Categories.reduce((sum, cat) => sum + cat.total, 0);
  const level2Completed = level2Categories.reduce((sum, cat) => sum + cat.completed, 0);
  const level2Percent = level2Total > 0 ? (level2Completed / level2Total) * 100 : 0;
  
  // Calculate Level 3 progress (Sentences)
  const level3Categories = Object.values(progress.level3);
  const level3Total = level3Categories.reduce((sum, cat) => sum + cat.total, 0);
  const level3Completed = level3Categories.reduce((sum, cat) => sum + cat.completed, 0);
  const level3Percent = level3Total > 0 ? (level3Completed / level3Total) * 100 : 0;
  
  // Overall progress is average of all three levels
  const overallPercent = Math.round((level1Percent + level2Percent + level3Percent) / 3);
  
  return {
    level1: Math.round(level1Percent),
    level2: Math.round(level2Percent),
    level3: Math.round(level3Percent),
    overall: overallPercent
  };
}

// ===== SAVE PROGRESS TO FIREBASE =====
async function saveProgressToFirebase(progress, overallProgress, language = 'english') {
  try {
    // Check if Firebase is available
    if (!window.db || typeof window.doc !== 'function' || typeof window.updateDoc !== 'function') {
      console.log("Firebase not available, skipping cloud save");
      return false;
    }
    
    // Get current user profile from localStorage
    const profileStr = localStorage.getItem('linguaKidsProfile');
    if (!profileStr) {
      console.log("No user profile found, skipping Firebase save");
      return false;
    }
    
    const profile = JSON.parse(profileStr);
    if (!profile || !profile.userId) {
      console.log("Invalid user profile, skipping Firebase save");
      return false;
    }
    
    console.log("Saving progress to Firebase for user:", profile.userId, "Language:", language);
    
    // Update the progress in the user's profile
    const userRef = window.doc(window.db, "profiles", profile.userId);
    
    // Prepare progress data with detailed level information
    const progressData = {
      [`progress.${language}.percent`]: overallProgress.overall,
      [`progress.${language}.level1`]: overallProgress.level1,
      [`progress.${language}.level2`]: overallProgress.level2,
      [`progress.${language}.level3`]: overallProgress.level3,
      [`progress.${language}.lastUpdated`]: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
    
    await window.updateDoc(userRef, progressData);
    console.log("Progress saved to Firebase for user:", profile.userId);
    
    // Also update the classStudents collection if this is a teacher-led student
    if (profile.studyMode === 'teacher' && profile.classId) {
      const classStudentId = `${profile.classId}_${profile.userId}`;
      const classStudentRef = window.doc(window.db, "classStudents", classStudentId);
      
      await window.updateDoc(classStudentRef, {
        [`progress.${language}.percent`]: overallProgress.overall,
        [`progress.${language}.level1`]: overallProgress.level1,
        [`progress.${language}.level2`]: overallProgress.level2,
        [`progress.${language}.level3`]: overallProgress.level3,
        [`progress.${language}.lastUpdated`]: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
      console.log("Class student progress updated in Firebase");
    }
    
    return true;
  } catch (error) {
    console.error("Error saving progress to Firebase:", error);
    return false;
  }
}

// ===== ENSURE ENGLISH PROGRESS SAVED =====
async function ensureEnglishProgressSaved() {
  const progress = JSON.parse(localStorage.getItem('linguaKidsProgress'));
  if (!progress) return false;
  
  const overallProgress = calculateOverallProgress(progress);
  return await saveProgressToFirebase(progress, overallProgress, 'english');
}

// ===== UPDATE PROGRESS =====
async function updateProgress(level, category, itemId = null) {
  const progress = initProgress();
  
  // Create a session key to prevent duplicate tracking in same session
  const sessionKey = `lingua_progress_${level}_${category}_${itemId !== null ? itemId : 'general'}_${new Date().toDateString()}`;
  
  if (sessionStorage.getItem(sessionKey)) {
    console.log(`Progress already tracked for: ${sessionKey}`);
    return false;
  }

  // Validate the category exists
  if (!progress[level] || !progress[level][category]) {
    console.error(`Invalid progress category: ${level}.${category}`);
    return false;
  }
  
  const categoryData = progress[level][category];
  
  // For learning levels, increment by 1
  if (categoryData.completed < categoryData.total) {
    categoryData.completed = Math.min(categoryData.completed + 1, categoryData.total);
  } else {
    return false; // Already completed
  }
  
  localStorage.setItem('linguaKidsProgress', JSON.stringify(progress));
  sessionStorage.setItem(sessionKey, 'true');
  
  console.log(`Progress updated: ${level}.${category} - ${categoryData.completed}/${categoryData.total}`);
  
  // Check for achievements and update streak
  checkCompletionAchievements(progress);
  updateStreak(progress);
  
  // Calculate overall progress and save to Firebase
  const overallProgress = calculateOverallProgress(progress);
  await saveProgressToFirebase(progress, overallProgress, 'english');
  
  return true;
}

// ===== UPDATE STREAK =====
function updateStreak(progress = null) {
  if (!progress) {
    progress = JSON.parse(localStorage.getItem('linguaKidsProgress'));
    if (!progress) return;
  }
  
  const today = new Date().toDateString();
  
  if (progress.sessionDate === today) {
    return; // Already updated streak today
  }
  
  const lastDate = progress.streak.lastDate ? new Date(progress.streak.lastDate) : null;
  const todayObj = new Date();
  todayObj.setHours(0, 0, 0, 0);
  
  if (lastDate) {
    lastDate.setHours(0, 0, 0, 0);
    const diffTime = todayObj - lastDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      // Consecutive day - increment streak
      progress.streak.count++;
    } else if (diffDays > 1) {
      // Streak broken - reset to 1
      progress.streak.count = 1;
    }
    // diffDays === 0 means same day, no change
  } else {
    // First time tracking - start streak
    progress.streak.count = 1;
  }
  
  progress.streak.lastDate = todayObj.toISOString();
  progress.sessionDate = today;
  localStorage.setItem('linguaKidsProgress', JSON.stringify(progress));
  
  checkStreakAchievements(progress);
}

// ===== CHECK COMPLETION ACHIEVEMENTS =====
function checkCompletionAchievements(progress) {
  let earned = false;
  
  // Calculate total completed activities across all categories
  const totalCompleted = 
    Object.values(progress.level1).reduce((sum, cat) => sum + cat.completed, 0) +
    Object.values(progress.level2).reduce((sum, cat) => sum + cat.completed, 0) +
    Object.values(progress.level3).reduce((sum, cat) => sum + cat.completed, 0);
  
  console.log('Total completed activities:', totalCompleted);
  
  // Check individual achievements
  if (totalCompleted > 0 && !progress.achievements.firstSteps) {
    progress.achievements.firstSteps = true;
    earned = true;
    showAchievementToast("First Steps!", "You've completed your first activity!");
  }
  
  // Alphabet Master - completed all alphabet activities
  if (progress.level1.alphabets.completed >= progress.level1.alphabets.total && !progress.achievements.alphabetMaster) {
    progress.achievements.alphabetMaster = true;
    earned = true;
    showAchievementToast("Alphabet Master!", "You've learned all the letters!");
  }
  
  // Number Whiz - completed all number activities
  if (progress.level1.numbers.completed >= progress.level1.numbers.total && !progress.achievements.numberWhiz) {
    progress.achievements.numberWhiz = true;
    earned = true;
    showAchievementToast("Number Whiz!", "You've mastered numbers 1-100!");
  }
  
  // Word Expert - completed all level 2 categories
  const level2Completed = Object.values(progress.level2).every(cat => cat.completed >= cat.total);
  if (level2Completed && !progress.achievements.wordExpert) {
    progress.achievements.wordExpert = true;
    earned = true;
    showAchievementToast("Word Expert!", "You've learned all basic words!");
  }
  
  // Sentence Builder - completed all level 3 categories
  const level3Completed = Object.values(progress.level3).every(cat => cat.completed >= cat.total);
  if (level3Completed && !progress.achievements.sentenceBuilder) {
    progress.achievements.sentenceBuilder = true;
    earned = true;
    showAchievementToast("Sentence Builder!", "You've mastered sentences!");
  }
  
  if (earned) {
    localStorage.setItem('linguaKidsProgress', JSON.stringify(progress));
    console.log('New achievements earned, progress saved');
  }
}

// ===== CHECK STREAK ACHIEVEMENTS =====
function checkStreakAchievements(progress) {
  let earned = false;
  
  if (progress.streak.count >= 7 && !progress.achievements.weekStreak) {
    progress.achievements.weekStreak = true;
    earned = true;
    showAchievementToast("7-Day Streak!", "You've practiced for 7 days in a row!");
  }
  
  if (progress.streak.count >= 30 && !progress.achievements.monthStreak) {
    progress.achievements.monthStreak = true;
    earned = true;
    showAchievementToast("30-Day Streak!", "You are a dedicated learner!");
  }
  
  if (earned) {
    localStorage.setItem('linguaKidsProgress', JSON.stringify(progress));
  }
}

// ===== SHOW ACHIEVEMENT TOAST =====
function showAchievementToast(title, description) {
  // Create toast element if it doesn't exist
  let toastEl = document.getElementById('achievementToastGlobal');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'achievementToastGlobal';
    toastEl.className = 'toast';
    toastEl.style.cssText = `
      position: fixed; 
      bottom: 20px; 
      right: 20px; 
      background: linear-gradient(135deg, #58cc02, #1cb0f6); 
      color: white; 
      padding: 15px 20px; 
      border-radius: 12px; 
      box-shadow: 0 6px 20px rgba(0,0,0,0.2); 
      z-index: 10000; 
      display: flex; 
      align-items: center; 
      gap: 15px; 
      transform: translateX(120%); 
      opacity: 0; 
      transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.5s ease-out;
      max-width: 400px;
      min-width: 300px;
      border-left: 5px solid gold;
    `;
    document.body.appendChild(toastEl);
  }
  
  // Update toast content
  toastEl.innerHTML = `
    <div style="font-size: 2.5rem;">
      <i class="fas fa-trophy" style="color: gold;"></i>
    </div>
    <div>
      <div style="font-weight: bold; font-size: 1.1rem; margin-bottom: 5px;">${title}</div>
      <div style="font-size: 0.9rem; opacity: 0.9;">${description}</div>
    </div>
  `;
  
  // Remove any existing timeouts
  if (window.achievementToastTimeout) {
    clearTimeout(window.achievementToastTimeout);
  }
  
  // Show toast with animation
  setTimeout(() => { 
    toastEl.style.transform = 'translateX(0)'; 
    toastEl.style.opacity = '1'; 
  }, 10);
  
  // Hide toast after 5 seconds
  window.achievementToastTimeout = setTimeout(() => { 
    toastEl.style.transform = 'translateX(120%)'; 
    toastEl.style.opacity = '0'; 
  }, 5000);
}

// ===== GET PROGRESS SUMMARY =====
function getProgressSummary() {
  const progress = JSON.parse(localStorage.getItem('linguaKidsProgress') || '{}');
  
  if (!progress || Object.keys(progress).length === 0) {
    return null;
  }
  
  // Calculate overall completion percentage
  const calculateLevelPercentage = (levelData) => {
    const categories = Object.values(levelData);
    if (categories.length === 0) return 0;
    const totalCompleted = categories.reduce((sum, cat) => sum + cat.completed, 0);
    const totalPossible = categories.reduce((sum, cat) => sum + cat.total, 0);
    return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
  };
  
  return {
    streak: progress.streak?.count || 0,
    level1: calculateLevelPercentage(progress.level1 || {}),
    level2: calculateLevelPercentage(progress.level2 || {}),
    level3: calculateLevelPercentage(progress.level3 || {}),
    achievements: Object.values(progress.achievements || {}).filter(a => a).length,
    totalAchievements: Object.keys(progress.achievements || {}).length,
    lastUpdated: progress.streak?.lastDate || null
  };
}

// ===== GET OVERALL PROGRESS FOR SPECIFIC LANGUAGE =====
function getOverallProgress(language = 'english') {
  const progress = JSON.parse(localStorage.getItem('linguaKidsProgress') || '{}');
  return calculateOverallProgress(progress);
}

// ===== RESET PROGRESS =====
function resetProgress() {
  // Clear all progress data
  localStorage.removeItem('linguaKidsProgress');
  sessionStorage.clear();
  
  // Reinitialize with default data
  initProgress();
  
  // Show confirmation toast
  showAchievementToast("Progress Reset", "All your progress has been cleared.");
  
  return true;
}

// ===== SYNC LOCAL PROGRESS TO FIREBASE =====
async function syncProgressToFirebase() {
  const progress = JSON.parse(localStorage.getItem('linguaKidsProgress') || '{}');
  if (!progress || Object.keys(progress).length === 0) {
    console.log("No progress to sync");
    return false;
  }
  
  const overallProgress = calculateOverallProgress(progress);
  return await saveProgressToFirebase(progress, overallProgress, 'english');
}

// ===== LOAD PROGRESS FROM FIREBASE =====
async function loadProgressFromFirebase() {
  try {
    // Check if Firebase is available
    if (!window.db || typeof window.getDoc !== 'function') {
      console.log("Firebase not available, skipping load");
      return false;
    }
    
    // Get current user profile from localStorage
    const profileStr = localStorage.getItem('linguaKidsProfile');
    if (!profileStr) {
      console.log("No user profile found, skipping Firebase load");
      return false;
    }
    
    const profile = JSON.parse(profileStr);
    if (!profile || !profile.userId) {
      console.log("Invalid user profile, skipping Firebase load");
      return false;
    }
    
    console.log("Loading progress from Firebase for user:", profile.userId);
    
    // Get the user's profile from Firebase
    const userRef = window.doc(window.db, "profiles", profile.userId);
    const userDoc = await window.getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Check if there's progress data in Firebase
      if (userData.progress && userData.progress.english) {
        const firebaseProgress = userData.progress.english;
        console.log("Found Firebase progress:", firebaseProgress);
        
        // Update localStorage with Firebase progress if it's more recent
        const localProgress = JSON.parse(localStorage.getItem('linguaKidsProgress') || '{}');
        const localLastUpdated = localProgress.streak?.lastDate;
        const firebaseLastUpdated = firebaseProgress.lastUpdated;
        
        // If Firebase has more recent progress, use it
        if (firebaseLastUpdated && (!localLastUpdated || new Date(firebaseLastUpdated) > new Date(localLastUpdated))) {
          console.log("Firebase progress is more recent, updating local storage");
          
          // Merge Firebase progress with local structure
          if (firebaseProgress.percent !== undefined) {
            // We only have overall percent, not detailed progress
            // This is a simplified sync - you might want to store more detailed progress
            console.log("Progress loaded from Firebase:", firebaseProgress.percent + "%");
          }
        }
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error loading progress from Firebase:", error);
    return false;
  }
}

// ===== SYNC ALL LANGUAGES TO FIREBASE =====
async function syncAllLanguagesToFirebase() {
  console.log("Syncing all language progress to Firebase...");
  
  const results = {
    english: false,
    hindi: false,
    marathi: false,
    chinese: false,
    german: false
  };
  
  // Sync English
  try {
    const englishProgress = JSON.parse(localStorage.getItem('linguaKidsProgress') || 'null');
    if (englishProgress) {
      const overallProgress = calculateOverallProgress(englishProgress);
      results.english = await saveProgressToFirebase(englishProgress, overallProgress, 'english');
    }
  } catch (e) {
    console.error("Error syncing English:", e);
  }
  
  // Sync Hindi (if functions available)
  if (window.saveHindiProgressToFirebase) {
    try {
      const hindiProgress = JSON.parse(localStorage.getItem('linguaKidsHindiProgress') || 'null');
      if (hindiProgress && window.calculateHindiOverallProgress) {
        const overallProgress = window.calculateHindiOverallProgress(hindiProgress);
        results.hindi = await window.saveHindiProgressToFirebase(hindiProgress, overallProgress, 'hindi');
      }
    } catch (e) {
      console.error("Error syncing Hindi:", e);
    }
  }
  
  // Sync Marathi (if functions available)
  if (window.saveMarathiProgressToFirebase) {
    try {
      const marathiProgress = JSON.parse(localStorage.getItem('linguaKidsMarathiProgress') || 'null');
      if (marathiProgress && window.calculateMarathiOverallProgress) {
        const overallProgress = window.calculateMarathiOverallProgress(marathiProgress);
        results.marathi = await window.saveMarathiProgressToFirebase(marathiProgress, overallProgress, 'marathi');
      }
    } catch (e) {
      console.error("Error syncing Marathi:", e);
    }
  }
  
  // Sync Chinese (if available)
  if (window.ChineseProgress && window.ChineseProgress.syncToFirebase) {
    try {
      results.chinese = await window.ChineseProgress.syncToFirebase();
    } catch (e) {
      console.error("Error syncing Chinese:", e);
    }
  } else if (window.syncChineseProgressToFirebase) {
    try {
      results.chinese = await window.syncChineseProgressToFirebase();
    } catch (e) {
      console.error("Error syncing Chinese:", e);
    }
  }
  
  // Sync German (if available)
  if (window.syncGermanProgressToFirebase) {
    try {
      results.german = await window.syncGermanProgressToFirebase();
    } catch (e) {
      console.error("Error syncing German:", e);
    }
  }
  
  console.log("Sync results:", results);
  return results;
}

// ===== EXPORT FUNCTIONS TO GLOBAL SCOPE =====
if (typeof window !== 'undefined') {
  window.initProgress = initProgress;
  window.updateProgress = updateProgress;
  window.updateStreak = updateStreak;
  window.showAchievementToast = showAchievementToast;
  window.getProgressSummary = getProgressSummary;
  window.getOverallProgress = getOverallProgress;
  window.resetProgress = resetProgress;
  window.syncProgressToFirebase = syncProgressToFirebase;
  window.calculateOverallProgress = calculateOverallProgress;
  window.saveProgressToFirebase = saveProgressToFirebase;
  window.ensureEnglishProgressSaved = ensureEnglishProgressSaved;
  window.loadProgressFromFirebase = loadProgressFromFirebase;
  window.syncAllLanguagesToFirebase = syncAllLanguagesToFirebase;
  
  // Auto-initialize progress when script loads
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing progress tracking...');
    initProgress();
    
    // Try to load from Firebase if profile exists
    setTimeout(() => {
      loadProgressFromFirebase();
    }, 1000);
  });
}