// File: mrprogress.js
// This file contains all the master logic for Marathi progress tracking, streaks, and achievements.

// Make sure these match the actual counts from marathi.html
const VOWELS_COUNT = 13;  // Based on VOWELS array in marathi.html
const CONSONANTS_COUNT = 38; // Based on CONSONANTS array in marathi.html
const TOTAL_ALPHABETS = VOWELS_COUNT + CONSONANTS_COUNT; // 51
const TOTAL_NUMBERS = 100;

// ===== SHOW SYNC STATUS =====
function showMarathiSyncStatus(message, isSuccess = true) {
  let syncStatus = document.getElementById('marathiSyncStatus');
  
  if (!syncStatus) {
    syncStatus = document.createElement('div');
    syncStatus.id = 'marathiSyncStatus';
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
    syncStatus.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span id="marathiSyncMessage">Syncing...</span>';
    document.body.appendChild(syncStatus);
  }
  
  const syncMessage = document.getElementById('marathiSyncMessage');
  if (syncMessage) {
    syncMessage.textContent = message;
    syncStatus.style.backgroundColor = isSuccess ? '#58cc02' : '#ff6b6b';
    syncStatus.style.display = 'flex';
    
    setTimeout(() => {
      syncStatus.style.display = 'none';
    }, 3000);
  }
}

// ===== CALCULATE OVERALL PROGRESS PERCENTAGE FOR MARATHI =====
function calculateMarathiOverallProgress(progress) {
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

// ===== SAVE MARATHI PROGRESS TO FIREBASE =====
async function saveMarathiProgressToFirebase(progress, overallProgress, language = 'marathi') {
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
    
    console.log("Saving Marathi progress to Firebase for user:", profile.userId);
    
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
    console.log("Marathi progress saved to Firebase for user:", profile.userId);
    
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
    console.error("Error saving Marathi progress to Firebase:", error);
    return false;
  }
}

// ===== ENSURE MARATHI PROGRESS SAVED =====
async function ensureMarathiProgressSaved() {
  const progress = JSON.parse(localStorage.getItem('linguaKidsMarathiProgress'));
  if (!progress) return false;
  
  const overallProgress = calculateMarathiOverallProgress(progress);
  return await saveMarathiProgressToFirebase(progress, overallProgress, 'marathi');
}

// ===== SYNC MARATHI PROGRESS TO FIREBASE =====
async function syncMarathiProgressToFirebase() {
  try {
    showMarathiSyncStatus("Syncing Marathi progress...", true);
    
    const progress = JSON.parse(localStorage.getItem('linguaKidsMarathiProgress') || 'null');
    if (!progress) {
      console.log("No Marathi progress to sync");
      showMarathiSyncStatus("No progress to sync", false);
      return false;
    }
    
    const overallProgress = calculateMarathiOverallProgress(progress);
    const result = await saveMarathiProgressToFirebase(progress, overallProgress, 'marathi');
    
    if (result) {
      showMarathiSyncStatus("Progress synced successfully!", true);
      showMarathiAchievementToast("Sync Complete", "Your progress has been saved to the cloud");
    } else {
      showMarathiSyncStatus("Sync failed", false);
    }
    
    return result;
  } catch (e) {
    console.error("Error syncing Marathi progress to Firebase:", e);
    showMarathiSyncStatus("Sync error", false);
    return false;
  }
}

// ===== LOAD MARATHI PROGRESS FROM FIREBASE =====
async function loadMarathiProgressFromFirebase() {
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
    
    console.log("Loading Marathi progress from Firebase for user:", profile.userId);
    
    // Get the user's profile from Firebase
    const userRef = window.doc(window.db, "profiles", profile.userId);
    const userDoc = await window.getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Check if there's Marathi progress data in Firebase
      if (userData.progress && userData.progress.marathi) {
        const firebaseProgress = userData.progress.marathi;
        console.log("Found Firebase Marathi progress:", firebaseProgress);
        
        // Update localStorage with Firebase progress if it's more recent
        const localProgress = JSON.parse(localStorage.getItem('linguaKidsMarathiProgress') || '{}');
        const localLastUpdated = localProgress.streak?.lastDate;
        const firebaseLastUpdated = firebaseProgress.lastUpdated;
        
        // If Firebase has more recent progress, show notification
        if (firebaseLastUpdated && (!localLastUpdated || new Date(firebaseLastUpdated) > new Date(localLastUpdated))) {
          console.log("Firebase progress is more recent");
          showMarathiAchievementToast("Cloud Progress Found", "Your progress from another device has been loaded");
        }
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error loading Marathi progress from Firebase:", error);
    return false;
  }
}

function initMarathiProgress() {
  try {
    let progress = null;
    
    // Try to get existing progress
    const savedProgress = localStorage.getItem('linguaKidsMarathiProgress');
    
    if (savedProgress) {
      try {
        progress = JSON.parse(savedProgress);
      } catch (e) {
        console.error("Error parsing saved progress, creating new one", e);
        progress = null;
      }
    }
    
    // If no valid progress exists, create default
    if (!progress) {
      const defaultProgress = {
        level1: {
          alphabets: { completed: 0, total: TOTAL_ALPHABETS },
          numbers: { completed: 0, total: TOTAL_NUMBERS }
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
          questions: { completed: 0, total: 10 }
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
        sessionDate: null 
      };
      
      progress = defaultProgress;
      localStorage.setItem('linguaKidsMarathiProgress', JSON.stringify(defaultProgress));
      console.log("Created new Marathi progress data with totals:", TOTAL_ALPHABETS, "alphabets,", TOTAL_NUMBERS, "numbers");
    } else {
      // Ensure all required fields exist in existing progress
      if (!progress.level1) progress.level1 = {};
      if (!progress.level1.alphabets) progress.level1.alphabets = { completed: 0, total: TOTAL_ALPHABETS };
      if (!progress.level1.numbers) progress.level1.numbers = { completed: 0, total: TOTAL_NUMBERS };
      
      if (!progress.level2) {
        progress.level2 = {
          fruits: { completed: 0, total: 10 },
          vegetables: { completed: 0, total: 10 },
          animals: { completed: 0, total: 10 },
          birds: { completed: 0, total: 10 },
          vehicles: { completed: 0, total: 10 },
          colors: { completed: 0, total: 10 }
        };
      }
      
      if (!progress.level3) {
        progress.level3 = {
          greetings: { completed: 0, total: 10 },
          activities: { completed: 0, total: 10 },
          questions: { completed: 0, total: 10 }
        };
      }
      
      if (!progress.achievements) {
        progress.achievements = {
          firstSteps: false, alphabetMaster: false, numberWhiz: false,
          wordExpert: false, sentenceBuilder: false,
          weekStreak: false, monthStreak: false
        };
      }
      
      if (!progress.streak) {
        progress.streak = { count: 0, lastDate: null };
      }
      
      // Update totals to ensure they're correct (in case they changed)
      progress.level1.alphabets.total = TOTAL_ALPHABETS;
      progress.level1.numbers.total = TOTAL_NUMBERS;
      
      localStorage.setItem('linguaKidsMarathiProgress', JSON.stringify(progress));
    }
    
    updateMarathiStreak();
    
    // Try to load from Firebase after initialization
    setTimeout(() => {
      loadMarathiProgressFromFirebase();
    }, 1000);
    
    return progress;
  } catch (e) {
    console.error("Error in initMarathiProgress:", e);
    return null;
  }
}

function updateMarathiStreak() {
  try {
    const progress = JSON.parse(localStorage.getItem('linguaKidsMarathiProgress'));
    if (!progress) return;
    
    const today = new Date().toDateString();
    
    if (!progress.streak) {
      progress.streak = { count: 0, lastDate: null };
    }
    
    if (progress.sessionDate !== today) {
      const lastDate = progress.streak.lastDate ? new Date(progress.streak.lastDate) : null;
      const todayDate = new Date();
      
      if (lastDate) {
        // Reset time part for accurate day calculation
        const lastDateOnly = new Date(lastDate);
        lastDateOnly.setHours(0, 0, 0, 0);
        const todayDateOnly = new Date(todayDate);
        todayDateOnly.setHours(0, 0, 0, 0);
        
        const diffTime = todayDateOnly.getTime() - lastDateOnly.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          progress.streak.count++;
        } else if (diffDays > 1) {
          progress.streak.count = 1;
        }
      } else {
        progress.streak.count = 1;
      }
      
      progress.streak.lastDate = todayDate.toISOString();
      progress.sessionDate = today;
      localStorage.setItem('linguaKidsMarathiProgress', JSON.stringify(progress));
      
      checkMarathiStreakAchievements(progress);
    }
  } catch (e) {
    console.error("Error in updateMarathiStreak:", e);
  }
}

// FIXED: Parameter order matches marathi.html (level, category, increment, itemIdentifier)
async function updateMarathiProgress(level, category, increment = 1, itemIdentifier = null) {
  try {
    // Create a session key to prevent duplicate tracking
    const today = new Date().toDateString();
    const sessionKey = `mr_progress_${level}_${category}_${itemIdentifier !== null ? itemIdentifier : 'category'}_${today}`;
    
    if (sessionStorage.getItem(sessionKey)) {
      console.log("Progress already tracked for this item today:", sessionKey);
      return false; // Already tracked this item today
    }

    const progress = JSON.parse(localStorage.getItem('linguaKidsMarathiProgress'));
    if (!progress) {
      console.log("No progress found, initializing...");
      initMarathiProgress();
      // Try again after initialization
      return updateMarathiProgress(level, category, increment, itemIdentifier);
    }
    
    // Ensure the path exists
    if (!progress[level]) {
      console.log("Level not found:", level);
      return false;
    }
    
    if (!progress[level][category]) {
      console.log("Category not found:", category);
      return false;
    }
    
    // Ensure completed and total are numbers
    const completed = parseInt(progress[level][category].completed) || 0;
    const total = parseInt(progress[level][category].total) || 1;
    
    if (completed < total) {
      // Increment and ensure we don't exceed total
      progress[level][category].completed = Math.min(completed + increment, total);
      
      progress.sessionDate = today;
      
      localStorage.setItem('linguaKidsMarathiProgress', JSON.stringify(progress));
      sessionStorage.setItem(sessionKey, 'true');
      
      console.log(`Progress updated: ${level}.${category} = ${progress[level][category].completed}/${total}`);
      
      checkMarathiCompletionAchievements(progress);
      updateMarathiStreak();
      
      // Calculate overall progress and save to Firebase
      const overallProgress = calculateMarathiOverallProgress(progress);
      await saveMarathiProgressToFirebase(progress, overallProgress, 'marathi');
      
      // Refresh display if on progress page
      if (typeof window.displayMarathiProgress === 'function') {
        window.displayMarathiProgress();
      }
      
      return true;
    } else {
      console.log(`Category ${level}.${category} already completed (${completed}/${total})`);
    }
    
    return false;
  } catch (e) {
    console.error("Error in updateMarathiProgress:", e);
    return false;
  }
}

function checkMarathiCompletionAchievements(progress) {
  try {
    if (!progress || !progress.achievements) return;
    
    let earnedAchievement = false;
    
    const totalCompleted = 
      (progress.level1?.alphabets?.completed || 0) + 
      (progress.level1?.numbers?.completed || 0) + 
      Object.values(progress.level2 || {}).reduce((sum, cat) => sum + (cat?.completed || 0), 0) +
      Object.values(progress.level3 || {}).reduce((sum, cat) => sum + (cat?.completed || 0), 0);
    
    if (totalCompleted > 0 && !progress.achievements.firstSteps) {
      progress.achievements.firstSteps = true; 
      earnedAchievement = true;
      showMarathiAchievementToast("पहिले पाऊल! (First Steps!)", "तुम्ही तुमची पहिली क्रियाकलाप पूर्ण केली आहे!");
    }
    
    const alphabetProgress = (progress.level1?.alphabets?.completed || 0) / (progress.level1?.alphabets?.total || 1);
    if (alphabetProgress >= 0.8 && !progress.achievements.alphabetMaster) {
      progress.achievements.alphabetMaster = true; 
      earnedAchievement = true;
      showMarathiAchievementToast("मुळाक्षरे विशेषज्ञ! (Alphabet Master!)", "तुम्ही बहुतेक मुळाक्षरे शिकलात!");
    }
    
    if ((progress.level1?.numbers?.completed || 0) >= 50 && !progress.achievements.numberWhiz) {
      progress.achievements.numberWhiz = true; 
      earnedAchievement = true;
      showMarathiAchievementToast("अंक विशेषज्ञ! (Number Whiz!)", "तुम्हाला अंक चांगले माहिती आहेत!");
    }
    
    const completedLevel2 = Object.values(progress.level2 || {}).filter(cat => (cat?.completed || 0) / (cat?.total || 1) >= 0.8).length;
    if (completedLevel2 >= 3 && !progress.achievements.wordExpert) {
      progress.achievements.wordExpert = true; 
      earnedAchievement = true;
      showMarathiAchievementToast("शब्द विशेषज्ञ! (Word Expert!)", "तुम्ही 3 शब्द श्रेणींमध्ये प्रावीण्य मिळवले आहे!");
    }
    
    const completedLevel3 = Object.values(progress.level3 || {}).filter(cat => (cat?.completed || 0) / (cat?.total || 1) >= 0.8).length;
    if (completedLevel3 >= 2 && !progress.achievements.sentenceBuilder) {
      progress.achievements.sentenceBuilder = true; 
      earnedAchievement = true;
      showMarathiAchievementToast("वाक्य बांधकाम करणारा! (Sentence Builder!)", "तुम्ही साधी वाक्ये तयार करू शकता!");
    }

    if (earnedAchievement) {
      localStorage.setItem('linguaKidsMarathiProgress', JSON.stringify(progress));
      // Try to update achievements display if on progress page
      if (typeof window.displayMarathiAchievements === 'function') {
        window.displayMarathiAchievements(progress.achievements);
      }
    }
  } catch (e) {
    console.error("Error in checkMarathiCompletionAchievements:", e);
  }
}

function checkMarathiStreakAchievements(progress) {
  try {
    if (!progress || !progress.achievements) return;
    
    let earned = false;
    if (progress.streak?.count >= 7 && !progress.achievements.weekStreak) {
        progress.achievements.weekStreak = true;
        showMarathiAchievementToast("7-दिवस सलग शिक्षण!", "तुम्ही सलग 7 दिवस सराव केला आहे!");
        earned = true;
    }
    if (progress.streak?.count >= 30 && !progress.achievements.monthStreak) {
        progress.achievements.monthStreak = true;
        showMarathiAchievementToast("30-दिवस सलग शिक्षण!", "तुम्ही एक समर्पित शिकणारे आहात!");
        earned = true;
    }
    if (earned) {
        localStorage.setItem('linguaKidsMarathiProgress', JSON.stringify(progress));
        // Try to update achievements display if on progress page
        if (typeof window.displayMarathiAchievements === 'function') {
          window.displayMarathiAchievements(progress.achievements);
        }
    }
  } catch (e) {
    console.error("Error in checkMarathiStreakAchievements:", e);
  }
}

function showMarathiAchievementToast(title, description) {
  try {
    // Check if toasts are disabled (check for hidden class on the main toast)
    const mainToast = document.getElementById('achievementToast');
    if (mainToast && window.getComputedStyle(mainToast).display === 'none') {
      return; // Toasts are disabled
    }
    
    let toastEl = document.getElementById('achievementToastGlobal');
    if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.id = 'achievementToastGlobal';
        toastEl.className = 'toast';
        toastEl.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #58cc02;
          color: white;
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 2000;
          display: flex;
          align-items: center;
          gap: 10px;
          transform: translateY(100px);
          opacity: 0;
          transition: transform 0.3s, opacity 0.3s;
          max-width: 350px;
          font-family: 'Quicksand', Arial, sans-serif;
        `;
        toastEl.innerHTML = `
          <i class="fas fa-trophy" style="color: gold;"></i>
          <div>
            <div class="toast-title" style="font-weight: bold;"></div>
            <div class="toast-desc"></div>
          </div>
        `;
        document.body.appendChild(toastEl);
    }
    
    toastEl.querySelector('.toast-title').textContent = title;
    toastEl.querySelector('.toast-desc').textContent = description;
    
    // Show toast
    setTimeout(() => {
      toastEl.style.transform = 'translateY(0)';
      toastEl.style.opacity = '1';
    }, 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
      toastEl.style.transform = 'translateY(100px)';
      toastEl.style.opacity = '0';
    }, 3000);
  } catch (e) {
    console.error("Error showing toast:", e);
  }
}

// ===== GET OVERALL PROGRESS (for external use) =====
function getMarathiOverallProgress() {
  try {
    const progress = JSON.parse(localStorage.getItem('linguaKidsMarathiProgress') || 'null');
    if (!progress) return 0;
    return calculateMarathiOverallProgress(progress).overall;
  } catch (e) {
    console.error("Error getting Marathi overall progress:", e);
    return 0;
  }
}

// ===== RESET MARATHI PROGRESS =====
function resetMarathiProgress() {
  try {
    // Clear all stored data
    localStorage.removeItem('linguaKidsMarathiProgress');
    sessionStorage.clear();
    
    // Reinitialize with default data
    const newProgress = initMarathiProgress();
    
    // Show confirmation toast
    showMarathiAchievementToast("प्रगती रीसेट!", "तुमचा सर्व प्रगती डेटा साफ झाला आहे.");
    
    // Sync reset to Firebase (set progress to 0)
    setTimeout(async () => {
      const overallProgress = calculateMarathiOverallProgress(newProgress);
      await saveMarathiProgressToFirebase(newProgress, overallProgress, 'marathi');
    }, 500);
    
    return newProgress;
  } catch (e) {
    console.error("Error resetting Marathi progress:", e);
    return null;
  }
}

// ===== EXPORT FUNCTIONS =====
// Make the function globally available
window.updateMarathiProgress = updateMarathiProgress;
window.initMarathiProgress = initMarathiProgress;
window.updateMarathiStreak = updateMarathiStreak;
window.checkMarathiCompletionAchievements = checkMarathiCompletionAchievements;
window.checkMarathiStreakAchievements = checkMarathiStreakAchievements;
window.showMarathiAchievementToast = showMarathiAchievementToast;
window.calculateMarathiOverallProgress = calculateMarathiOverallProgress;
window.saveMarathiProgressToFirebase = saveMarathiProgressToFirebase;
window.getMarathiOverallProgress = getMarathiOverallProgress;
window.syncMarathiProgressToFirebase = syncMarathiProgressToFirebase;
window.ensureMarathiProgressSaved = ensureMarathiProgressSaved;
window.loadMarathiProgressFromFirebase = loadMarathiProgressFromFirebase;
window.resetMarathiProgress = resetMarathiProgress;
window.showMarathiSyncStatus = showMarathiSyncStatus;

// Auto-initialize when loaded
try {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Don't auto-init if we're on the progress page - let the page handle it
    if (!window.location || !window.location.pathname.includes('mrprogress.html')) {
      initMarathiProgress();
    }
  }
} catch (e) {
  console.error("Error auto-initializing:", e);
}