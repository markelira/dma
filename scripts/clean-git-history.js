#!/usr/bin/env node

/**
 * ELIRA Git History Cleaning Script
 * 
 * This script safely removes sensitive data from git history using native git tools
 * as a cross-platform alternative to BFG Repo-Cleaner.
 * 
 * ⚠️  WARNING: This script rewrites git history. Use with caution!
 * 
 * Usage: node scripts/clean-git-history.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync, spawn } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

class GitHistoryCleaner {
  constructor() {
    this.secureBackupsPath = '../secure/git-backups';
    this.sensitivePatterns = [
      // Environment files
      '.env',
      '.env.local',
      '.env.production', 
      '.env.development',
      'functions/.env',
      
      // Firebase admin keys
      '*firebase-adminsdk*.json',
      '*service-account*.json',
      '*.pem',
      '*.key',
      
      // Other sensitive files
      'passwords.txt',
      'secrets.txt',
      'config/secrets.json',
      'config/keys.json'
    ];

    this.sensitiveTextPatterns = [
      // API Keys
      'AIza[0-9A-Za-z_-]{35}', // Firebase API keys
      'pk_test_[0-9A-Za-z]{24,}', // Stripe test publishable keys
      'pk_live_[0-9A-Za-z]{24,}', // Stripe live publishable keys  
      'sk_test_[0-9A-Za-z]{24,}', // Stripe test secret keys
      'sk_live_[0-9A-Za-z]{24,}', // Stripe live secret keys
      'rk_test_[0-9A-Za-z]{24,}', // Stripe test restricted keys
      'rk_live_[0-9A-Za-z]{24,}', // Stripe live restricted keys
      'whsec_[0-9A-Za-z]{32,}', // Stripe webhook secrets
      'SG\\.[0-9A-Za-z_-]{22}\\.[0-9A-Za-z_-]{43}', // SendGrid API keys
      
      // Firebase config
      'firebase[A-Z][a-zA-Z]*":\\s*"[^"]{10,}"',
      'databaseURL":\\s*"https://[^"]+\\.firebaseio\\.com"',
      'storageBucket":\\s*"[^"]+\\.appspot\\.com"',
      
      // Common patterns
      'password"?\\s*[:=]\\s*"[^"]{3,}"',
      'secret"?\\s*[:=]\\s*"[^"]{10,}"',
      'token"?\\s*[:=]\\s*"[^"]{10,}"',
      'key"?\\s*[:=]\\s*"[^"]{10,}"'
    ];

    console.log('🧹 ELIRA Git History Cleaner');
    console.log('=' .repeat(50));
  }

  /**
   * Check if git repository exists and is clean
   */
  checkGitRepository() {
    try {
      // Check if we're in a git repository
      execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
      
      // Check for uncommitted changes
      const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      if (status) {
        console.log('❌ Repository has uncommitted changes:');
        console.log(status);
        throw new Error('Please commit or stash changes before cleaning history');
      }

      // Get current branch
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      console.log(`✅ Repository is clean, current branch: ${currentBranch}`);
      
      return { isGitRepo: true, isClean: true, currentBranch };
    } catch (error) {
      if (error.message.includes('not a git repository')) {
        throw new Error('This is not a git repository');
      }
      throw error;
    }
  }

  /**
   * Create backup of current repository
   */
  createRepositoryBackup(currentBranch) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.secureBackupsPath, `repo-backup-${timestamp}`);
    
    console.log('\n📁 Creating repository backup...');
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.secureBackupsPath)) {
      fs.mkdirSync(this.secureBackupsPath, { recursive: true });
    }

    try {
      // Create a bare clone as backup
      execSync(`git clone --bare . "${backupPath}"`, { stdio: 'inherit' });
      
      // Also backup current .git directory
      const gitBackupPath = path.join(this.secureBackupsPath, `dot-git-backup-${timestamp}`);
      execSync(`cp -r .git "${gitBackupPath}"`, { stdio: 'ignore' });
      
      console.log(`✅ Repository backed up to: ${backupPath}`);
      console.log(`✅ .git directory backed up to: ${gitBackupPath}`);
      
      return { backupPath, gitBackupPath };
    } catch (error) {
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }

  /**
   * Scan git history for sensitive files
   */
  scanGitHistory() {
    console.log('\n🔍 Scanning git history for sensitive files...');
    
    const foundFiles = new Set();
    const foundPatterns = new Set();

    try {
      // Get all files that have ever existed in git history
      const allFiles = execSync('git log --pretty=format: --name-only --diff-filter=A', { encoding: 'utf8' })
        .split('\n')
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index); // unique

      // Check against our sensitive patterns
      for (const file of allFiles) {
        for (const pattern of this.sensitivePatterns) {
          // Simple glob matching
          const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*');
          
          if (new RegExp(regexPattern).test(file)) {
            foundFiles.add(file);
            foundPatterns.add(pattern);
          }
        }
      }

      console.log(`Found ${foundFiles.size} potentially sensitive files:`);
      Array.from(foundFiles).forEach(file => {
        console.log(`  📄 ${file}`);
      });

      if (foundFiles.size === 0) {
        console.log('✅ No sensitive files found in git history');
      }

      return { foundFiles: Array.from(foundFiles), foundPatterns: Array.from(foundPatterns) };
    } catch (error) {
      throw new Error(`Failed to scan git history: ${error.message}`);
    }
  }

  /**
   * Create replacement patterns file for text content
   */
  createReplacementPatterns() {
    const replacementFile = path.join(this.secureBackupsPath, 'replacement-patterns.txt');
    
    const patterns = [
      // Replace actual sensitive values with placeholders
      'AIza[0-9A-Za-z_-]{35}===>FIREBASE_API_KEY_REMOVED',
      'pk_test_[0-9A-Za-z]{24,}===>STRIPE_PUBLISHABLE_KEY_REMOVED',
      'pk_live_[0-9A-Za-z]{24,}===>STRIPE_LIVE_PUBLISHABLE_KEY_REMOVED',
      'sk_test_[0-9A-Za-z]{24,}===>STRIPE_SECRET_KEY_REMOVED', 
      'sk_live_[0-9A-Za-z]{24,}===>STRIPE_LIVE_SECRET_KEY_REMOVED',
      'rk_test_[0-9A-Za-z]{24,}===>STRIPE_RESTRICTED_KEY_REMOVED',
      'rk_live_[0-9A-Za-z]{24,}===>STRIPE_LIVE_RESTRICTED_KEY_REMOVED',
      'whsec_[0-9A-Za-z]{32,}===>STRIPE_WEBHOOK_SECRET_REMOVED',
      'SG\\.[0-9A-Za-z_-]{22}\\.[0-9A-Za-z_-]{43}===>SENDGRID_API_KEY_REMOVED'
    ];

    fs.writeFileSync(replacementFile, patterns.join('\n'));
    console.log(`✅ Created replacement patterns file: ${replacementFile}`);
    
    return replacementFile;
  }

  /**
   * Remove sensitive files using git filter-branch
   */
  async removeSensitiveFiles(foundFiles) {
    if (foundFiles.length === 0) {
      console.log('✅ No files to remove from history');
      return true;
    }

    console.log('\n🗑️  Removing sensitive files from git history...');
    console.log('⚠️  This will rewrite git history and may take some time');

    const confirm = await askQuestion('❓ Continue with file removal? (y/N): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('❌ File removal cancelled');
      return false;
    }

    try {
      for (const file of foundFiles) {
        console.log(`🗑️  Removing: ${file}`);
        
        // Use git filter-branch to remove the file from history
        const filterCommand = `git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch "${file}"' --prune-empty --tag-name-filter cat -- --all`;
        
        execSync(filterCommand, { stdio: 'inherit' });
      }

      console.log('✅ Sensitive files removed from git history');
      return true;
    } catch (error) {
      console.error('❌ Failed to remove files from git history:', error.message);
      return false;
    }
  }

  /**
   * Clean up git repository after history rewrite
   */
  cleanupRepository() {
    console.log('\n🧹 Cleaning up repository...');

    try {
      // Remove filter-branch backup refs
      execSync('git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin', { stdio: 'ignore' });
      
      // Expire reflog entries
      execSync('git reflog expire --expire=now --all', { stdio: 'inherit' });
      
      // Garbage collect with aggressive pruning
      execSync('git gc --prune=now --aggressive', { stdio: 'inherit' });

      console.log('✅ Repository cleanup completed');
    } catch (error) {
      console.log('⚠️  Some cleanup operations failed, but history cleaning may still be successful');
      console.log(`Error: ${error.message}`);
    }
  }

  /**
   * Display security warnings and next steps
   */
  displaySecurityWarnings() {
    console.log('\n🚨 SECURITY WARNINGS & NEXT STEPS');
    console.log('=' .repeat(50));
    
    console.log('\n⚠️  CRITICAL ACTIONS REQUIRED:');
    console.log('   1. 🔄 Force push cleaned history: git push --force-with-lease origin --all');
    console.log('   2. 🔄 Force push tags: git push --force-with-lease origin --tags');
    console.log('   3. 📢 Notify team members to re-clone repository');
    console.log('   4. 🔐 Rotate all exposed keys immediately');
    console.log('   5. 🔍 Monitor for any unauthorized access');

    console.log('\n📋 Team Coordination:');
    console.log('   • All team members must delete their local clones');
    console.log('   • Fresh git clone required: git clone <repository-url>');
    console.log('   • Old commits/branches will be orphaned');
    console.log('   • CI/CD systems may need repository re-cloning');

    console.log('\n🔐 Key Rotation Required:');
    console.log('   • Firebase API keys');
    console.log('   • Stripe API keys'); 
    console.log('   • SendGrid API keys');
    console.log('   • Any other exposed secrets');

    console.log('\n📞 Emergency Actions:');
    console.log('   • Review access logs in all services');
    console.log('   • Check for unusual activity');
    console.log('   • Update security monitoring');
  }

  /**
   * Generate recovery instructions
   */
  generateRecoveryInstructions(backupPath) {
    const recoveryFile = path.join(this.secureBackupsPath, 'RECOVERY_INSTRUCTIONS.md');
    
    const instructions = `# Git History Cleaning Recovery Instructions

## Backup Information
- **Backup Location**: ${backupPath}
- **Created**: ${new Date().toISOString()}
- **Repository**: ${process.cwd()}

## To Restore from Backup (if needed):
1. Stop all work on current repository
2. Navigate to backup location: \`cd "${backupPath}"\`
3. Clone backup: \`git clone . /path/to/new-location\`
4. Verify restoration is complete

## Force Push Commands (run from main repository):
\`\`\`bash
# Push all branches (DANGEROUS - coordinate with team!)
git push --force-with-lease origin --all

# Push all tags
git push --force-with-lease origin --tags
\`\`\`

## Team Instructions:
All team members must:
1. Delete their local repository clone
2. Fresh clone: \`git clone <repository-url>\`
3. Verify they have the cleaned history

## Verification:
\`\`\`bash
# Check that sensitive files are gone from history
git log --all --name-only | grep -E "\\.(env|key|json)$"

# Should return no sensitive files
\`\`\`

## Emergency Contacts:
- Repository admin: [Add contact info]
- Security team: [Add contact info]
`;

    fs.writeFileSync(recoveryFile, instructions);
    console.log(`📋 Recovery instructions saved: ${recoveryFile}`);
  }

  /**
   * Main cleaning process
   */
  async cleanGitHistory() {
    try {
      console.log('🔒 Starting git history cleaning process...');
      console.log('⚠️  WARNING: This will rewrite git history!');
      
      // Step 1: Check repository status
      const { currentBranch } = this.checkGitRepository();

      // Step 2: Create backup
      const { backupPath } = this.createRepositoryBackup(currentBranch);

      // Step 3: Scan for sensitive data
      const { foundFiles } = this.scanGitHistory();

      if (foundFiles.length === 0) {
        console.log('\n🎉 No sensitive files found in git history');
        console.log('✅ Your repository is clean!');
        rl.close();
        return;
      }

      // Step 4: Confirm cleaning
      console.log('\n⚠️  DANGER ZONE: About to rewrite git history');
      console.log('   This action cannot be undone without the backup');
      console.log('   All team members will need to re-clone the repository');
      
      const confirmCleaning = await askQuestion('\n❓ Proceed with history cleaning? (y/N): ');
      if (confirmCleaning.toLowerCase() !== 'y') {
        console.log('❌ History cleaning cancelled');
        rl.close();
        return;
      }

      // Step 5: Remove sensitive files
      const filesRemoved = await this.removeSensitiveFiles(foundFiles);
      if (!filesRemoved) {
        rl.close();
        return;
      }

      // Step 6: Cleanup repository
      this.cleanupRepository();

      // Step 7: Generate recovery instructions
      this.generateRecoveryInstructions(backupPath);

      // Step 8: Display warnings
      this.displaySecurityWarnings();

      console.log('\n✅ Git history cleaning completed!');
      console.log('📋 Next: Review recovery instructions and force push changes');

    } catch (error) {
      console.error('❌ Error during git history cleaning:', error.message);
      console.log('\n🔄 Repository backups available in:', this.secureBackupsPath);
    } finally {
      rl.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const cleaner = new GitHistoryCleaner();
  cleaner.cleanGitHistory();
}

module.exports = { GitHistoryCleaner };