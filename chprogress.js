// === Chinese Progress Tracking System ===
// Use a namespace pattern to avoid global variable conflicts
const ChineseProgress = (function() {
  const PROGRESS_KEY = 'linguaKidsChineseProgress';
  
  // ===== SHOW SYNC STATUS =====
  function showSyncStatus(message, isSuccess = true) {
    let syncStatus = document.getElementById('chineseSyncStatus');
    
    if (!syncStatus) {
      syncStatus = document.createElement('div');
      syncStatus.id = 'chineseSyncStatus';
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
      syncStatus.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span id="chineseSyncMessage">Syncing...</span>';
      document.body.appendChild(syncStatus);
    }
    
    const syncMessage = document.getElementById('chineseSyncMessage');
    if (syncMessage) {
      syncMessage.textContent = message;
      syncStatus.style.backgroundColor = isSuccess ? '#58cc02' : '#ff6b6b';
      syncStatus.style.display = 'flex';
      
      setTimeout(() => {
        syncStatus.style.display = 'none';
      }, 3000);
    }
  }
  
  // ===== CALCULATE OVERALL PROGRESS PERCENTAGE FOR CHINESE =====
  function calculateOverallProgress(progress) {
    if (!progress) return { level1: 0, level2: 0, level3: 0, overall: 0 };
    
    // Level 1: Pinyin & Numbers (initials, finals, numbers)
    const level1Categories = Object.values(progress.level1 || {});
    const level1Total = level1Categories.reduce((sum, cat) => sum + (cat?.total || 0), 0);
    const level1Completed = level1Categories.reduce((sum, cat) => sum + (cat?.completed || 0), 0);
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

  // ===== SAVE CHINESE PROGRESS TO FIREBASE =====
  async function saveToFirebase(progress, overallProgress, language = 'chinese') {
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
      
      console.log("Saving Chinese progress to Firebase for user:", profile.userId);
      
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
      console.log("Chinese progress saved to Firebase for user:", profile.userId);
      
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
      console.error("Error saving Chinese progress to Firebase:", error);
      return false;
    }
  }

  // ===== ENSURE CHINESE PROGRESS SAVED =====
  async function ensureChineseProgressSaved() {
    const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    if (!progress) return false;
    
    const overallProgress = calculateOverallProgress(progress);
    return await saveToFirebase(progress, overallProgress, 'chinese');
  }

  // ===== SYNC TO FIREBASE =====
  async function syncToFirebase() {
    try {
      showSyncStatus("Syncing Chinese progress...", true);
      
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null');
      if (!progress) {
        console.log("No Chinese progress to sync");
        showSyncStatus("No progress to sync", false);
        return false;
      }
      
      const overallProgress = calculateOverallProgress(progress);
      const result = await saveToFirebase(progress, overallProgress, 'chinese');
      
      if (result) {
        showSyncStatus("Progress synced successfully!", true);
        showAchievementToast("Sync Complete", "Your progress has been saved to the cloud");
      } else {
        showSyncStatus("Sync failed", false);
      }
      
      return result;
    } catch (e) {
      console.error("Error syncing Chinese progress to Firebase:", e);
      showSyncStatus("Sync error", false);
      return false;
    }
  }

  // ===== LOAD FROM FIREBASE =====
  async function loadFromFirebase() {
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
      
      console.log("Loading Chinese progress from Firebase for user:", profile.userId);
      
      // Get the user's profile from Firebase
      const userRef = window.doc(window.db, "profiles", profile.userId);
      const userDoc = await window.getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Check if there's Chinese progress data in Firebase
        if (userData.progress && userData.progress.chinese) {
          const firebaseProgress = userData.progress.chinese;
          console.log("Found Firebase Chinese progress:", firebaseProgress);
          
          // Update localStorage with Firebase progress if it's more recent
          const localProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
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
      console.error("Error loading Chinese progress from Firebase:", error);
      return false;
    }
  }

  function init() {
    let progress = null;
    
    try {
      progress = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    } catch (e) {
      console.error("Error parsing Chinese progress:", e);
    }
    
    if (!progress) {
      const defaultProgress = {
        level1: {
          initials: { completed: 0, total: 23 },
          finals: { completed: 0, total: 35 },
          numbers: { completed: 0, total: 100 }
        },
        level2: {
          fruits: { completed: 0, total: 15 },
          vegetables: { completed: 0, total: 15 },
          animals: { completed: 0, total: 20 },
          birds: { completed: 0, total: 14 },
          vehicles: { completed: 0, total: 19 },
          colours: { completed: 0, total: 10 }
        },
        level3: {
          greetings: { completed: 0, total: 19 },
          activities: { completed: 0, total: 20 },
          questions: { completed: 0, total: 15 }
        },
        achievements: {
          firstSteps: false,
          initialMaster: false,
          finalMaster: false,
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
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(defaultProgress));
      console.log("Created new Chinese progress data");
    } else {
      // Migrate old data structure if needed
      progress = migrateProgressData(progress);
    }
    
    updateStreak();
    
    // Try to load from Firebase after initialization
    setTimeout(() => {
      loadFromFirebase();
    }, 1000);
    
    return progress;
  }

  function migrateProgressData(progress) {
    let modified = false;
    
    // Ensure level1 structure
    if (!progress.level1) {
      progress.level1 = {
        initials: { completed: 0, total: 23 },
        finals: { completed: 0, total: 35 },
        numbers: { completed: 0, total: 100 }
      };
      modified = true;
    } else {
      if (!progress.level1.initials) {
        progress.level1.initials = { completed: 0, total: 23 };
        modified = true;
      }
      if (!progress.level1.finals) {
        progress.level1.finals = { completed: 0, total: 35 };
        modified = true;
      }
      if (!progress.level1.numbers) {
        progress.level1.numbers = { completed: 0, total: 100 };
        modified = true;
      }
    }
    
    // Ensure level2 structure with correct totals
    if (!progress.level2) {
      progress.level2 = {
        fruits: { completed: 0, total: 15 },
        vegetables: { completed: 0, total: 15 },
        animals: { completed: 0, total: 20 },
        birds: { completed: 0, total: 14 },
        vehicles: { completed: 0, total: 19 },
        colours: { completed: 0, total: 10 }
      };
      modified = true;
    } else {
      // Update totals if they're incorrect
      const correctTotals = {
        fruits: 15,
        vegetables: 15,
        animals: 20,
        birds: 14,
        vehicles: 19,
        colours: 10
      };
      
      Object.keys(correctTotals).forEach(cat => {
        if (!progress.level2[cat]) {
          progress.level2[cat] = { completed: 0, total: correctTotals[cat] };
          modified = true;
        } else if (progress.level2[cat].total !== correctTotals[cat]) {
          progress.level2[cat].total = correctTotals[cat];
          if (progress.level2[cat].completed > correctTotals[cat]) {
            progress.level2[cat].completed = correctTotals[cat];
          }
          modified = true;
        }
      });
    }
    
    // Ensure level3 structure with correct totals
    if (!progress.level3) {
      progress.level3 = {
        greetings: { completed: 0, total: 19 },
        activities: { completed: 0, total: 20 },
        questions: { completed: 0, total: 15 }
      };
      modified = true;
    } else {
      const correctLevel3Totals = {
        greetings: 19,
        activities: 20,
        questions: 15
      };
      
      Object.keys(correctLevel3Totals).forEach(cat => {
        if (!progress.level3[cat]) {
          progress.level3[cat] = { completed: 0, total: correctLevel3Totals[cat] };
          modified = true;
        } else if (progress.level3[cat].total !== correctLevel3Totals[cat]) {
          progress.level3[cat].total = correctLevel3Totals[cat];
          if (progress.level3[cat].completed > correctLevel3Totals[cat]) {
            progress.level3[cat].completed = correctLevel3Totals[cat];
          }
          modified = true;
        }
      });
    }
    
    // Ensure achievements structure
    if (!progress.achievements) {
      progress.achievements = {
        firstSteps: false,
        initialMaster: false,
        finalMaster: false,
        numberWhiz: false,
        wordExpert: false,
        sentenceBuilder: false,
        weekStreak: false,
        monthStreak: false
      };
      modified = true;
    }
    
    // Ensure streak structure
    if (!progress.streak) {
      progress.streak = { count: 0, lastDate: null };
      modified = true;
    }
    
    if (modified) {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    }
    
    return progress;
  }

  function updateStreak() {
    const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    if (!progress) return 0;
    
    const today = new Date().toDateString();
    
    // Update streak only if this is a new day
    if (progress.sessionDate !== today) {
      const lastDate = progress.streak.lastDate ? new Date(progress.streak.lastDate) : null;
      const todayDate = new Date(today);
      
      if (lastDate) {
        // Reset time part for accurate day calculation
        const lastDateOnly = new Date(lastDate);
        lastDateOnly.setHours(0, 0, 0, 0);
        const todayDateOnly = new Date(todayDate);
        todayDateOnly.setHours(0, 0, 0, 0);
        
        const diffTime = todayDateOnly.getTime() - lastDateOnly.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Consecutive day - increment streak
          progress.streak.count++;
        } else if (diffDays > 1) {
          // Streak broken - reset to 1
          progress.streak.count = 1;
        }
        // If diffDays === 0, same day - no change
      } else {
        // First time - start streak
        progress.streak.count = 1;
      }
      
      progress.streak.lastDate = today;
      progress.sessionDate = today;
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      
      checkStreakAchievements(progress.streak.count);
    }
    
    return progress.streak.count;
  }

  async function updateProgress(level, category, increment = 1) {
    let progress = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    
    if (!progress) progress = init();

    if (progress[level] && progress[level][category]) {
      // Create session key to prevent duplicate tracking
      const today = new Date().toDateString();
      const sessionKey = `ch_progress_${level}_${category}_${today}`;
      
      if (sessionStorage.getItem(sessionKey) && increment >= 1) {
        console.log(`Progress for ${level}.${category} already tracked today`);
        return false;
      }
      
      // Don't exceed total
      const newCompleted = Math.min(
        progress[level][category].completed + increment, 
        progress[level][category].total
      );
      
      // Only update if there's a change
      if (newCompleted !== progress[level][category].completed) {
        progress[level][category].completed = newCompleted;
        
        // Update session date to trigger streak check
        progress.sessionDate = today;
        
        // Set session lock
        sessionStorage.setItem(sessionKey, 'true');
        
        checkCompletionAchievements(progress);
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
        
        // Update streak
        updateStreak();
        
        // Calculate overall progress and save to Firebase
        const overallProgress = calculateOverallProgress(progress);
        await saveToFirebase(progress, overallProgress, 'chinese');
        
        return true;
      }
    }
    return false;
  }

  function checkStreakAchievements(streak) {
    const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    if (!progress) return;
    
    let earnedAchievement = false;
    
    if (streak >= 7 && !progress.achievements.weekStreak) {
      progress.achievements.weekStreak = true;
      earnedAchievement = true;
      showAchievementToast("7-Day Streak!", "You've practiced Chinese for 7 days in a row!");
    }
    
    if (streak >= 30 && !progress.achievements.monthStreak) {
      progress.achievements.monthStreak = true;
      earnedAchievement = true;
      showAchievementToast("30-Day Streak!", "You're a dedicated Chinese learner!");
    }
    
    if (earnedAchievement) {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    }
  }

  function checkCompletionAchievements(progress) {
    if (!progress) return;
    
    let earnedAchievement = false;
    
    // First Steps - any activity completed
    if (!progress.achievements.firstSteps) {
      const anyProgress = 
        Object.values(progress.level1).some(cat => cat.completed > 0) ||
        Object.values(progress.level2).some(cat => cat.completed > 0) ||
        Object.values(progress.level3).some(cat => cat.completed > 0);
      
      if (anyProgress) {
        progress.achievements.firstSteps = true;
        earnedAchievement = true;
        showAchievementToast("First Steps!", "You've completed your first Chinese activity!");
      }
    }
    
    // Initials Master - learn all initials
    if (!progress.achievements.initialMaster && 
        progress.level1.initials.completed >= progress.level1.initials.total) {
      progress.achievements.initialMaster = true;
      earnedAchievement = true;
      showAchievementToast("Initials Master!", "You've learned all Chinese initials!");
    }
    
    // Finals Master - learn all finals
    if (!progress.achievements.finalMaster && 
        progress.level1.finals.completed >= progress.level1.finals.total) {
      progress.achievements.finalMaster = true;
      earnedAchievement = true;
      showAchievementToast("Finals Master!", "You've learned all Chinese finals!");
    }
    
    // Number Whiz - learn 50 numbers
    if (!progress.achievements.numberWhiz && progress.level1.numbers.completed >= 50) {
      progress.achievements.numberWhiz = true;
      earnedAchievement = true;
      showAchievementToast("Number Whiz!", "You know your Chinese numbers well!");
    }
    
    // Word Expert - master 3 word categories (80% completion in each)
    if (!progress.achievements.wordExpert) {
      const wordCategories = Object.keys(progress.level2);
      const masteredCategories = wordCategories.filter(cat => 
        progress.level2[cat].completed / progress.level2[cat].total >= 0.8
      ).length;
      
      if (masteredCategories >= 3) {
        progress.achievements.wordExpert = true;
        earnedAchievement = true;
        showAchievementToast("Word Expert!", "You've mastered 3 Chinese word categories!");
      }
    }
    
    // Sentence Builder - complete Level 3 (all categories at 80%)
    if (!progress.achievements.sentenceBuilder) {
      const level3Categories = Object.keys(progress.level3);
      const masteredLevel3 = level3Categories.filter(cat => 
        progress.level3[cat].completed / progress.level3[cat].total >= 0.8
      ).length;
      
      if (masteredLevel3 >= 2) {
        progress.achievements.sentenceBuilder = true;
        earnedAchievement = true;
        showAchievementToast("Sentence Builder!", "You can form simple Chinese sentences!");
      }
    }
    
    if (earnedAchievement) {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    }
  }

  function showAchievementToast(title, description) {
    // Try to find existing toast
    let toast = document.getElementById('chineseAchievementToast');
    
    if (!toast) {
      // Create toast element if it doesn't exist
      toast = document.createElement('div');
      toast.id = 'chineseAchievementToast';
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
        transform: translateY(100px);
        opacity: 0;
        transition: transform 0.3s, opacity 0.3s;
        max-width: 350px;
        font-family: 'Quicksand', Arial, sans-serif;
      `;
      toast.innerHTML = `
        <i class="fas fa-trophy" style="color: gold;"></i>
        <div>
          <div class="toast-title" style="font-weight: bold;"></div>
          <div class="toast-desc"></div>
        </div>
      `;
      document.body.appendChild(toast);
    }
    
    // Update toast content
    const titleEl = toast.querySelector('.toast-title');
    const descEl = toast.querySelector('.toast-desc');
    
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = description;
    
    // Show toast
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
    }, 3000);
  }

  // ===== GET OVERALL PROGRESS (for external use) =====
  function getOverallProgress() {
    try {
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null');
      if (!progress) return 0;
      return calculateOverallProgress(progress).overall;
    } catch (e) {
      console.error("Error getting Chinese overall progress:", e);
      return 0;
    }
  }

  // ===== GET LEVEL PROGRESS DETAILS =====
  function getLevelProgress(level) {
    try {
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null');
      if (!progress || !progress[level]) return 0;
      
      const overallProgress = calculateOverallProgress(progress);
      switch(level) {
        case 'level1': return overallProgress.level1;
        case 'level2': return overallProgress.level2;
        case 'level3': return overallProgress.level3;
        default: return 0;
      }
    } catch (e) {
      console.error("Error getting Chinese level progress:", e);
      return 0;
    }
  }

  // ===== GET CATEGORY PROGRESS =====
  function getCategoryProgress(level, category) {
    try {
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null');
      if (!progress || !progress[level] || !progress[level][category]) {
        return { completed: 0, total: 0, percentage: 0 };
      }
      
      const cat = progress[level][category];
      const percentage = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
      
      return {
        completed: cat.completed,
        total: cat.total,
        percentage: percentage
      };
    } catch (e) {
      console.error("Error getting Chinese category progress:", e);
      return { completed: 0, total: 0, percentage: 0 };
    }
  }

  // ===== RESET ALL PROGRESS =====
  function resetProgress() {
    localStorage.removeItem(PROGRESS_KEY);
    sessionStorage.clear();
    const newProgress = init();
    showAchievementToast("Progress Reset", "All Chinese progress has been cleared.");
    
    // Sync reset to Firebase (set progress to 0)
    setTimeout(async () => {
      const overallProgress = calculateOverallProgress(newProgress);
      await saveToFirebase(newProgress, overallProgress, 'chinese');
    }, 500);
    
    return newProgress;
  }

  // Public API
  return {
    init: init,
    updateProgress: updateProgress,
    updateStreak: updateStreak,
    calculateOverallProgress: calculateOverallProgress,
    saveToFirebase: saveToFirebase,
    getOverallProgress: getOverallProgress,
    syncToFirebase: syncToFirebase,
    loadFromFirebase: loadFromFirebase,
    ensureChineseProgressSaved: ensureChineseProgressSaved,
    getLevelProgress: getLevelProgress,
    getCategoryProgress: getCategoryProgress,
    showAchievementToast: showAchievementToast,
    resetProgress: resetProgress,
    migrateProgressData: migrateProgressData,
    showSyncStatus: showSyncStatus
  };
})();

// Make functions globally available through the namespace
window.ChineseProgress = ChineseProgress;
window.initChineseProgress = ChineseProgress.init;
window.updateProgress = ChineseProgress.updateProgress;
window.updateStreak = ChineseProgress.updateStreak;
window.calculateChineseOverallProgress = ChineseProgress.calculateOverallProgress;
window.saveChineseProgressToFirebase = ChineseProgress.saveToFirebase;
window.getChineseOverallProgress = ChineseProgress.getOverallProgress;
window.syncChineseProgressToFirebase = ChineseProgress.syncToFirebase;
window.loadChineseProgressFromFirebase = ChineseProgress.loadFromFirebase;
window.ensureChineseProgressSaved = ChineseProgress.ensureChineseProgressSaved;
window.getChineseLevelProgress = ChineseProgress.getLevelProgress;
window.getChineseCategoryProgress = ChineseProgress.getCategoryProgress;
window.showAchievementToast = ChineseProgress.showAchievementToast;
window.resetChineseProgress = ChineseProgress.resetProgress;
window.showChineseSyncStatus = ChineseProgress.showSyncStatus;

// Initialize progress system when script loads (only if not already initialized)
if (typeof window._chineseProgressInitialized === 'undefined') {
  window._chineseProgressInitialized = true;
  ChineseProgress.init();
}

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChineseProgress;
}