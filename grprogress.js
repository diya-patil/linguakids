// grprogress.js - Enhanced Progress Tracking System for German Learning App

// ===== SHOW SYNC STATUS =====
function showGermanSyncStatus(message, isSuccess = true) {
  let syncStatus = document.getElementById('germanSyncStatus');
  
  if (!syncStatus) {
    syncStatus = document.createElement('div');
    syncStatus.id = 'germanSyncStatus';
    syncStatus.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: #58cc02;
      color: white;
      padding: 8px 15px;
      border-radius: 50px;
      font-size: 0.8rem;
      display: none;
      align-items: center;
      gap: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      z-index: 1000;
    `;
    syncStatus.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span id="germanSyncMessage">Syncing...</span>';
    document.body.appendChild(syncStatus);
  }
  
  const syncMessage = document.getElementById('germanSyncMessage');
  if (syncMessage) {
    syncMessage.textContent = message;
    syncStatus.style.backgroundColor = isSuccess ? '#58cc02' : '#ff6b6b';
    syncStatus.style.display = 'flex';
    
    setTimeout(() => {
      syncStatus.style.display = 'none';
    }, 3000);
  }
}

// ===== CALCULATE OVERALL PROGRESS PERCENTAGE FOR GERMAN =====
function calculateGermanOverallProgress(progress) {
  if (!progress) return { level1: 0, level2: 0, level3: 0, overall: 0 };
  
  // Level 1: Alphabets & Numbers
  const level1Total = (progress.level1?.alphabets?.total || 0) + (progress.level1?.numbers?.total || 0);
  const level1Completed = (progress.level1?.alphabets?.completed || 0) + (progress.level1?.numbers?.completed || 0);
  const level1Percent = level1Total > 0 ? (level1Completed / level1Total) * 100 : 0;
  
  // Level 2: Basic Words
  const level2Categories = Object.values(progress.level2 || {});
  const level2Total = level2Categories.reduce((sum, cat) => sum + (cat?.total || 0), 0);
  const level2Completed = level2Categories.reduce((sum, cat) => sum + (cat?.completed || 0), 0);
  const level2Percent = level2Total > 0 ? (level2Completed / level2Total) * 100 : 0;
  
  // Level 3: Sentences
  const level3Categories = Object.values(progress.level3 || {});
  const level3Total = level3Categories.reduce((sum, cat) => sum + (cat?.total || 0), 0);
  const level3Completed = level3Categories.reduce((sum, cat) => sum + (cat?.completed || 0), 0);
  const level3Percent = level3Total > 0 ? (level3Completed / level3Total) * 100 : 0;
  
  return {
    level1: Math.round(level1Percent),
    level2: Math.round(level2Percent),
    level3: Math.round(level3Percent),
    overall: Math.round((level1Percent + level2Percent + level3Percent) / 3)
  };
}

// ===== SAVE GERMAN PROGRESS TO FIREBASE =====
async function saveGermanProgressToFirebase(progress, overallProgress, language = 'german') {
  try {
    // Check if Firebase is available
    if (typeof window === 'undefined' || !window.db || typeof window.doc !== 'function' || typeof window.updateDoc !== 'function') {
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
    
    console.log("Saving German progress to Firebase for user:", profile.userId);
    
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
    console.log("German progress saved to Firebase for user:", profile.userId);
    
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
    console.error("Error saving German progress to Firebase:", error);
    return false;
  }
}

// ===== ENSURE GERMAN PROGRESS SAVED =====
async function ensureGermanProgressSaved() {
  const progress = JSON.parse(localStorage.getItem('grprogress'));
  if (!progress) return false;
  
  const overallProgress = calculateGermanOverallProgress(progress);
  return await saveGermanProgressToFirebase(progress, overallProgress, 'german');
}

// ===== SYNC GERMAN PROGRESS TO FIREBASE =====
async function syncGermanProgressToFirebase() {
  try {
    showGermanSyncStatus("Syncing German progress...", true);
    
    const progress = JSON.parse(localStorage.getItem('grprogress') || 'null');
    if (!progress) {
      console.log("No German progress to sync");
      showGermanSyncStatus("No progress to sync", false);
      return false;
    }
    
    const overallProgress = calculateGermanOverallProgress(progress);
    const result = await saveGermanProgressToFirebase(progress, overallProgress, 'german');
    
    if (result) {
      showGermanSyncStatus("Progress synced successfully!", true);
      showAchievementToast("Sync Complete", "Your progress has been saved to the cloud");
    } else {
      showGermanSyncStatus("Sync failed", false);
    }
    
    return result;
  } catch (e) {
    console.error("Error syncing German progress to Firebase:", e);
    showGermanSyncStatus("Sync error", false);
    return false;
  }
}

// ===== LOAD GERMAN PROGRESS FROM FIREBASE =====
async function loadGermanProgressFromFirebase() {
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
    
    console.log("Loading German progress from Firebase for user:", profile.userId);
    
    // Get the user's profile from Firebase
    const userRef = window.doc(window.db, "profiles", profile.userId);
    const userDoc = await window.getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Check if there's German progress data in Firebase
      if (userData.progress && userData.progress.german) {
        const firebaseProgress = userData.progress.german;
        console.log("Found Firebase German progress:", firebaseProgress);
        
        // Update localStorage with Firebase progress if it's more recent
        const localProgress = JSON.parse(localStorage.getItem('grprogress') || '{}');
        const localLastUpdated = localProgress.streak?.lastDate;
        const firebaseLastUpdated = firebaseProgress.lastUpdated;
        
        // If Firebase has more recent progress, show notification
        if (firebaseLastUpdated && (!localLastUpdated || new Date(firebaseLastUpdated) > new Date(localLastUpdated))) {
          console.log("Firebase progress is more recent");
          showAchievementToast("Cloud Progress Found", "Your progress from another device has been loaded");
        }
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error loading German progress from Firebase:", error);
    return false;
  }
}

// ===== Progress Data Structure =====
function getDefaultProgress() {
  return {
    level1: {
      alphabets: { completed: 0, total: 30 }, // 26 standard + 4 special (Ä, Ö, Ü, ß)
      numbers: { completed: 0, total: 100 }    // 1-100
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
      firstSteps: false,
      alphabetMaster: false,
      numberWhiz: false,
      wordExpert: false,
      sentenceBuilder: false,
      weekStreak: false,
      monthStreak: false
    },
    streak: {
      count: 0,
      lastDate: null
    },
    sessionDate: new Date().toDateString()
  };
}

// === Initialize Progress System ===
function initProgress() {
  if (!localStorage.getItem('grprogress')) {
    const defaultProgress = getDefaultProgress();
    localStorage.setItem('grprogress', JSON.stringify(defaultProgress));
    console.log("Created new progress data");
  }
  
  // Always update streak when initializing
  updateStreak();
  
  // Try to load from Firebase after initialization
  setTimeout(() => {
    loadGermanProgressFromFirebase();
  }, 1000);
  
  return JSON.parse(localStorage.getItem('grprogress'));
}

// === Update Streak ===
function updateStreak() {
  const progress = JSON.parse(localStorage.getItem('grprogress')) || getDefaultProgress();
  const today = new Date().toDateString();
  
  console.log("Streak update - Current:", progress.streak.count, "Last date:", progress.streak.lastDate, "Today:", today);
  
  // If no last date, start streak
  if (!progress.streak.lastDate) {
    progress.streak.count = 1;
    progress.streak.lastDate = today;
    progress.sessionDate = today;
    localStorage.setItem('grprogress', JSON.stringify(progress));
    console.log("New streak started: 1 day");
    return progress;
  }
  
  // If already visited today, no change needed
  if (progress.streak.lastDate === today) {
    console.log("Already visited today, streak unchanged:", progress.streak.count);
    return progress;
  }
  
  // Calculate day difference
  const lastDate = new Date(progress.streak.lastDate);
  const todayDate = new Date(today);
  const diffTime = Math.abs(todayDate - lastDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  console.log("Days since last visit:", diffDays);
  
  if (diffDays === 1) {
    // Consecutive day - increment streak
    progress.streak.count++;
    console.log("Consecutive day! Streak increased to:", progress.streak.count);
    checkStreakAchievements(progress.streak.count, progress);
  } else if (diffDays > 1) {
    // Broken streak - reset to 1
    progress.streak.count = 1;
    console.log("Streak broken. Reset to 1");
  }
  
  // Update dates
  progress.streak.lastDate = today;
  progress.sessionDate = today;
  localStorage.setItem('grprogress', JSON.stringify(progress));
  
  console.log("Final streak:", progress.streak.count);
  return progress;
}

// === Enhanced Update Progress (General category view) ===
async function updateProgress(level, category, increment = 1) {
  const progress = JSON.parse(localStorage.getItem('grprogress')) || getDefaultProgress();
  
  console.log(`Updating progress: Level=${level}, Category=${category}, Increment=${increment}`);
  
  if (progress[level] && progress[level][category]) {
    // Check if progress is already tracked for this specific general activity today
    const today = new Date().toDateString();
    const progressKey = `${level}_${category}_${today}`;
    
    if (sessionStorage.getItem(progressKey) && increment >= 1) {
      console.log(`General progress for ${level}.${category} already tracked today.`);
      return false; 
    }

    // Use standard increment, capped at total
    progress[level][category].completed += increment;
    
    // Ensure we don't exceed total
    if (progress[level][category].completed > progress[level][category].total) {
      progress[level][category].completed = progress[level][category].total;
    }
    
    // Set session lock only if increment is >= 1 (full activity completed)
    if (increment >= 1) {
      sessionStorage.setItem(progressKey, 'true');
    }
    
    console.log(`New progress: ${progress[level][category].completed}/${progress[level][category].total}`);
    
    checkCompletionAchievements(progress);
    localStorage.setItem('grprogress', JSON.stringify(progress));
    
    // Also update streak when progress is made
    updateStreak();
    
    // Calculate overall progress and save to Firebase
    const overallProgress = calculateGermanOverallProgress(progress);
    await saveGermanProgressToFirebase(progress, overallProgress, 'german');
    
    return true;
  }
  
  console.error(`Progress category not found: ${level}.${category}`);
  return false;
}

// === Enhanced Level 2 Progress Tracking (Per Item) ===
async function updateLevel2WordProgress(category, wordIndex) {
  const progress = JSON.parse(localStorage.getItem('grprogress')) || getDefaultProgress();
  
  if (progress.level2 && progress.level2[category]) {
    const today = new Date().toDateString();
    const wordKey = `word_${category}_${wordIndex}_${today}`;
    
    if (sessionStorage.getItem(wordKey)) {
      console.log(`Word ${wordIndex} in ${category} already tracked today.`);
      return false;
    }

    // Increment completed count by 1
    if (progress.level2[category].completed < progress.level2[category].total) {
      progress.level2[category].completed = Math.min(
        progress.level2[category].completed + 1,
        progress.level2[category].total
      );
      
      sessionStorage.setItem(wordKey, 'true'); // Set lock for this specific item
      
      console.log(`Level 2 progress updated: ${category} - ${progress.level2[category].completed}/${progress.level2[category].total}`);
      
      checkCompletionAchievements(progress);
      localStorage.setItem('grprogress', JSON.stringify(progress));
      
      // Also update streak when progress is made
      updateStreak();
      
      // Calculate overall progress and save to Firebase
      const overallProgress = calculateGermanOverallProgress(progress);
      await saveGermanProgressToFirebase(progress, overallProgress, 'german');
    }
    return true;
  }
  
  return false;
}

// === Enhanced Level 3 Progress Tracking (Per Item) ===
async function updateLevel3SentenceProgress(category, sentenceIndex) {
  const progress = JSON.parse(localStorage.getItem('grprogress')) || getDefaultProgress();
  
  if (progress.level3 && progress.level3[category]) {
    const today = new Date().toDateString();
    const sentenceKey = `sentence_${category}_${sentenceIndex}_${today}`;
    
    if (sessionStorage.getItem(sentenceKey)) {
      console.log(`Sentence ${sentenceIndex} in ${category} already tracked today.`);
      return false;
    }

    // Increment completed count by 1
    if (progress.level3[category].completed < progress.level3[category].total) {
      progress.level3[category].completed = Math.min(
        progress.level3[category].completed + 1,
        progress.level3[category].total
      );
      
      sessionStorage.setItem(sentenceKey, 'true'); // Set lock for this specific item
      
      console.log(`Level 3 progress updated: ${category} - ${progress.level3[category].completed}/${progress.level3[category].total}`);
      
      checkCompletionAchievements(progress);
      localStorage.setItem('grprogress', JSON.stringify(progress));
      
      // Also update streak when progress is made
      updateStreak();
      
      // Calculate overall progress and save to Firebase
      const overallProgress = calculateGermanOverallProgress(progress);
      await saveGermanProgressToFirebase(progress, overallProgress, 'german');
    }
    return true;
  }
  
  return false;
}

// === Check Completion Achievements ===
function checkCompletionAchievements(progress) {
  let earnedAchievement = false;
  
  // Check if any progress has been made
  const totalProgress = 
    Object.values(progress.level1).reduce((sum, cat) => sum + cat.completed, 0) +
    Object.values(progress.level2).reduce((sum, cat) => sum + cat.completed, 0) +
    Object.values(progress.level3).reduce((sum, cat) => sum + cat.completed, 0);
  
  if (totalProgress > 0 && !progress.achievements.firstSteps) {
    progress.achievements.firstSteps = true;
    earnedAchievement = true;
    showAchievementToast("Erste Schritte! (First Steps!)", "You've completed your first activity!");
  }
  
  // Alphabet Master - learn all letters (30 total)
  if (progress.level1.alphabets.completed >= 30 && !progress.achievements.alphabetMaster) {
    progress.achievements.alphabetMaster = true;
    earnedAchievement = true;
    showAchievementToast("Alphabet-Meister! (Alphabet Master!)", "You've learned all the German letters!");
  }
  
  // Number Whiz - know 50+ numbers
  if (progress.level1.numbers.completed >= 50 && !progress.achievements.numberWhiz) {
    progress.achievements.numberWhiz = true;
    earnedAchievement = true;
    showAchievementToast("Zahlen-Ass! (Number Whiz!)", "You know 50+ German numbers!");
  }
  
  // Word Expert - master 3 word categories (80% completion in each)
  const level2Categories = Object.keys(progress.level2);
  const masteredLevel2 = level2Categories.filter(cat => 
    progress.level2[cat].completed / progress.level2[cat].total >= 0.8
  ).length;
  
  if (masteredLevel2 >= 3 && !progress.achievements.wordExpert) {
    progress.achievements.wordExpert = true;
    earnedAchievement = true;
    showAchievementToast("Wort-Experte! (Word Expert!)", "You've mastered 3 word categories!");
  }
  
  // Sentence Builder - complete 2 sentence categories (80% completion in each)
  const level3Categories = Object.keys(progress.level3);
  const masteredLevel3 = level3Categories.filter(cat => 
    progress.level3[cat].completed / progress.level3[cat].total >= 0.8
  ).length;
  
  if (masteredLevel3 >= 2 && !progress.achievements.sentenceBuilder) {
    progress.achievements.sentenceBuilder = true;
    earnedAchievement = true;
    showAchievementToast("Satz-Bauer! (Sentence Builder!)", "You've mastered 2 sentence categories!");
  }
  
  if (earnedAchievement) {
    localStorage.setItem('grprogress', JSON.stringify(progress));
  }
  
  return earnedAchievement;
}

// === Check Streak Achievements ===
function checkStreakAchievements(streak, progress) {
  let earnedAchievement = false;
  
  if (streak >= 7 && !progress.achievements.weekStreak) {
    progress.achievements.weekStreak = true;
    earnedAchievement = true;
    showAchievementToast("7-Tage-Serie! (7-Day Streak!)", "You've practiced for 7 days in a row!");
  }
  
  if (streak >= 30 && !progress.achievements.monthStreak) {
    progress.achievements.monthStreak = true;
    earnedAchievement = true;
    showAchievementToast("30-Tage-Serie! (30-Day Streak!)", "You're a dedicated learner!");
  }
  
  if (earnedAchievement) {
    localStorage.setItem('grprogress', JSON.stringify(progress));
  }
  
  return earnedAchievement;
}

// === Show Achievement Toast ===
function showAchievementToast(title, description) {
  let toast = document.getElementById('germanAchievementToast');
  
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'germanAchievementToast';
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #58cc02;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: 'Quicksand', Arial, sans-serif;
      transform: translateY(100px);
      opacity: 0;
      transition: transform 0.3s, opacity 0.3s;
      max-width: 400px;
    `;
    toast.innerHTML = `
      <i class="fas fa-trophy" style="color: gold;"></i>
      <div>
        <div style="font-weight: bold;"></div>
        <div></div>
      </div>
    `;
    document.body.appendChild(toast);
  }
  
  toast.querySelector('div > div:first-child').textContent = title;
  toast.querySelector('div > div:last-child').textContent = description;
  
  // Show toast
  toast.style.transform = 'translateY(0)';
  toast.style.opacity = '1';
  
  setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
  }, 4000);
}

// === Get Progress Data ===
function getProgressData() {
  try {
    const stored = localStorage.getItem('grprogress');
    return stored ? JSON.parse(stored) : getDefaultProgress();
  } catch (e) {
    console.error("Error parsing progress data:", e);
    return getDefaultProgress();
  }
}

// === Calculate Level Progress Percentages ===
function getLevelProgress(level) {
  const progress = getProgressData();
  const levelData = progress[level];
  
  if (!levelData) return 0;
  
  let totalCompleted = 0;
  let totalItems = 0;
  
  Object.keys(levelData).forEach(category => {
    if (levelData[category] && typeof levelData[category].completed === 'number' && typeof levelData[category].total === 'number') {
      totalCompleted += levelData[category].completed;
      totalItems += levelData[category].total;
    }
  });
  
  return totalItems > 0 ? Math.min(100, Math.round((totalCompleted / totalItems) * 100)) : 0;
}

// === Get Category Progress ===
function getCategoryProgress(level, category) {
  const progress = getProgressData();
  
  if (progress[level] && progress[level][category]) {
    return {
      completed: progress[level][category].completed,
      total: progress[level][category].total,
      percentage: Math.min(100, Math.round((progress[level][category].completed / progress[level][category].total) * 100))
    };
  }
  
  return { completed: 0, total: 0, percentage: 0 };
}

// === Reset All Progress ===
function resetAllProgress() {
  localStorage.removeItem('grprogress');
  sessionStorage.clear();
  const newProgress = initProgress();
  showAchievementToast("Progress Reset", "All your progress has been reset.");
  
  // Sync reset to Firebase (set progress to 0)
  setTimeout(async () => {
    const overallProgress = calculateGermanOverallProgress(newProgress);
    await saveGermanProgressToFirebase(newProgress, overallProgress, 'german');
  }, 500);
  
  return getDefaultProgress();
}

// === Get Achievement Status ===
function getAchievementStatus(achievementId) {
  const progress = getProgressData();
  return progress.achievements[achievementId] || false;
}

// === Get All Achievements ===
function getAllAchievements() {
  const progress = getProgressData();
  return progress.achievements;
}

// === Get Streak Info ===
function getStreakInfo() {
  const progress = getProgressData();
  return {
    count: progress.streak.count || 0,
    lastDate: progress.streak.lastDate,
    sessionDate: progress.sessionDate
  };
}

// === Check if Item Already Tracked Today ===
function isItemTrackedToday(itemType, category, index) {
  const today = new Date().toDateString();
  const key = `${itemType}_${category}_${index}_${today}`;
  return sessionStorage.getItem(key) !== null;
}

// === Mark Item as Tracked ===
function markItemTracked(itemType, category, index) {
  const today = new Date().toDateString();
  const key = `${itemType}_${category}_${index}_${today}`;
  sessionStorage.setItem(key, 'true');
}

// ===== GET OVERALL PROGRESS (for external use) =====
function getGermanOverallProgress() {
  try {
    const progress = JSON.parse(localStorage.getItem('grprogress') || 'null');
    if (!progress) return 0;
    return calculateGermanOverallProgress(progress).overall;
  } catch (e) {
    console.error("Error getting German overall progress:", e);
    return 0;
  }
}

// Initialize when script loads
if (typeof window !== 'undefined') {
  // Only initialize if we're in a browser environment
  initProgress();
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getDefaultProgress,
    initProgress,
    updateStreak,
    updateProgress,
    updateLevel2WordProgress,
    updateLevel3SentenceProgress,
    checkCompletionAchievements,
    checkStreakAchievements,
    showAchievementToast,
    getProgressData,
    getLevelProgress,
    getCategoryProgress,
    resetAllProgress,
    getAchievementStatus,
    getAllAchievements,
    getStreakInfo,
    isItemTrackedToday,
    markItemTracked,
    calculateGermanOverallProgress,
    saveGermanProgressToFirebase,
    getGermanOverallProgress,
    syncGermanProgressToFirebase,
    ensureGermanProgressSaved,
    loadGermanProgressFromFirebase,
    showGermanSyncStatus
  };
}

// Make functions globally available for browser
if (typeof window !== 'undefined') {
  window.initProgress = initProgress;
  window.updateProgress = updateProgress;
  window.updateLevel2WordProgress = updateLevel2WordProgress;
  window.updateLevel3SentenceProgress = updateLevel3SentenceProgress;
  window.getProgressData = getProgressData;
  window.resetAllProgress = resetAllProgress;
  window.showAchievementToast = showAchievementToast;
  window.calculateGermanOverallProgress = calculateGermanOverallProgress;
  window.saveGermanProgressToFirebase = saveGermanProgressToFirebase;
  window.getGermanOverallProgress = getGermanOverallProgress;
  window.syncGermanProgressToFirebase = syncGermanProgressToFirebase;
  window.ensureGermanProgressSaved = ensureGermanProgressSaved;
  window.loadGermanProgressFromFirebase = loadGermanProgressFromFirebase;
  window.showGermanSyncStatus = showGermanSyncStatus;
}