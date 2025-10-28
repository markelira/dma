#!/usr/bin/env node

/**
 * ELIRA Advanced Git History Cleaner
 * 
 * This script provides multiple methods for cleaning git history:
 * 1. BFG Repo-Cleaner (when available)
 * 2. Native git filter-branch
 * 3. git filter-repo (if available)
 * 
 * Usage: node scripts/advanced-git-cleaner.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync, spawn } = require('child_process');
const os = require('os');

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

class AdvancedGitCleaner {
  constructor() {
    this.secureBackupsPath = '../secure/git-backups';
    this.platform = os.platform();
    
    console.log('🔧 ELIRA Advanced Git History Cleaner');
    console.log('=' .repeat(50));
    console.log(`Platform: ${this.platform}`);
  }

  /**
   * Check which cleaning tools are available
   */
  checkAvailableTools() {
    const tools = {
      bfg: false,
      filterRepo: false,
      filterBranch: true // Always available with git
    };

    // Check for BFG Repo-Cleaner
    try {
      execSync('bfg --version', { stdio: 'ignore' });
      tools.bfg = true;
      console.log('✅ BFG Repo-Cleaner available');
    } catch (error) {
      console.log('❌ BFG Repo-Cleaner not available');
    }

    // Check for git filter-repo
    try {
      execSync('git filter-repo --version', { stdio: 'ignore' });
      tools.filterRepo = true;
      console.log('✅ git filter-repo available');
    } catch (error) {
      console.log('❌ git filter-repo not available');
    }

    console.log('✅ git filter-branch available (built-in)');

    return tools;
  }

  /**
   * Install BFG Repo-Cleaner based on platform
   */
  async installBFG() {
    console.log('\n📦 Installing BFG Repo-Cleaner...');

    const installInstructions = {
      darwin: 'brew install bfg',
      linux: 'Download from: https://rtyley.github.io/bfg-repo-cleaner/',
      win32: 'Download from: https://rtyley.github.io/bfg-repo-cleaner/'
    };

    if (this.platform === 'darwin') {
      const installHomebrew = await askQuestion('Install BFG via Homebrew? (y/N): ');
      if (installHomebrew.toLowerCase() === 'y') {
        try {
          execSync('brew install bfg', { stdio: 'inherit' });
          console.log('✅ BFG Repo-Cleaner installed successfully');
          return true;
        } catch (error) {
          console.log('❌ Failed to install BFG via Homebrew');
        }
      }
    }

    console.log('\n📋 Manual installation instructions:');
    console.log(`   Platform: ${this.platform}`);
    console.log(`   Command: ${installInstructions[this.platform]}`);
    
    if (this.platform !== 'darwin') {
      console.log('\n   For manual installation:');
      console.log('   1. Download bfg.jar from https://rtyley.github.io/bfg-repo-cleaner/');
      console.log('   2. Run: java -jar bfg.jar <options>');
    }

    return false;
  }

  /**
   * Create comprehensive patterns file for sensitive data
   */
  createSensitivePatterns() {
    const patternsDir = path.join(this.secureBackupsPath, 'patterns');
    if (!fs.existsSync(patternsDir)) {
      fs.mkdirSync(patternsDir, { recursive: true });
    }

    // File patterns for BFG
    const filePatterns = [
      '.env',
      '.env.local',
      '.env.production',
      '.env.development',
      '*firebase-adminsdk*.json',
      '*service-account*.json',
      '*.pem',
      '*.key',
      'passwords.txt',
      'secrets.txt'
    ];

    // Text replacement patterns
    const textReplacements = [
      // Firebase
      'AIza[0-9A-Za-z_-]{35}===>***REMOVED***',
      'firebase[A-Z][a-zA-Z]*":\\s*"[^"]{10,}"===>***REMOVED***',
      
      // Stripe
      'pk_(test|live)_[0-9A-Za-z]{24,}===>***REMOVED***',
      'sk_(test|live)_[0-9A-Za-z]{24,}===>***REMOVED***',  
      'rk_(test|live)_[0-9A-Za-z]{24,}===>***REMOVED***',
      'whsec_[0-9A-Za-z]{32,}===>***REMOVED***',
      
      // SendGrid
      'SG\\.[0-9A-Za-z_-]{22}\\.[0-9A-Za-z_-]{43}===>***REMOVED***',
      
      // Generic patterns
      'password"?\\s*[:=]\\s*"[^"]{3,}"===>***REMOVED***',
      'secret"?\\s*[:=]\\s*"[^"]{10,}"===>***REMOVED***',
      'token"?\\s*[:=]\\s*"[^"]{10,}"===>***REMOVED***'
    ];

    // Write files
    const filePatternFile = path.join(patternsDir, 'sensitive-files.txt');
    const textReplacementFile = path.join(patternsDir, 'text-replacements.txt');

    fs.writeFileSync(filePatternFile, filePatterns.join('\n'));
    fs.writeFileSync(textReplacementFile, textReplacements.join('\n'));

    console.log(`✅ File patterns: ${filePatternFile}`);
    console.log(`✅ Text replacements: ${textReplacementFile}`);

    return { filePatternFile, textReplacementFile };
  }

  /**
   * Clean using BFG Repo-Cleaner
   */
  async cleanWithBFG() {
    console.log('\n🔧 Using BFG Repo-Cleaner...');
    
    const { filePatternFile, textReplacementFile } = this.createSensitivePatterns();

    try {
      // Delete sensitive files
      console.log('🗑️  Deleting sensitive files...');
      for (const pattern of ['.env', '*.key', '*firebase-adminsdk*.json']) {
        try {
          execSync(`bfg --delete-files "${pattern}"`, { stdio: 'inherit' });
        } catch (error) {
          console.log(`⚠️  Pattern ${pattern} not found or already cleaned`);
        }
      }

      // Replace sensitive text
      console.log('🔒 Replacing sensitive text...');
      try {
        execSync(`bfg --replace-text "${textReplacementFile}"`, { stdio: 'inherit' });
      } catch (error) {
        console.log('⚠️  Text replacement completed with some warnings');
      }

      console.log('✅ BFG cleaning completed');
      return true;
    } catch (error) {
      console.error('❌ BFG cleaning failed:', error.message);
      return false;
    }
  }

  /**
   * Clean using git filter-repo
   */
  async cleanWithFilterRepo() {
    console.log('\n🔧 Using git filter-repo...');

    const sensitiveFiles = [
      '.env',
      '.env.local', 
      '.env.production',
      '.env.development',
      'functions/.env'
    ];

    try {
      // Build filter-repo command
      const pathFilters = sensitiveFiles.map(file => `--path ${file}`).join(' ');
      const command = `git filter-repo ${pathFilters} --invert-paths`;

      console.log(`Running: ${command}`);
      execSync(command, { stdio: 'inherit' });

      console.log('✅ git filter-repo cleaning completed');
      return true;
    } catch (error) {
      console.error('❌ git filter-repo cleaning failed:', error.message);
      return false;
    }
  }

  /**
   * Clean using native git filter-branch
   */
  async cleanWithFilterBranch() {
    console.log('\n🔧 Using git filter-branch (native)...');

    const sensitiveFiles = [
      '.env',
      '.env.local',
      '.env.production', 
      '.env.development',
      'functions/.env'
    ];

    try {
      for (const file of sensitiveFiles) {
        console.log(`🗑️  Removing: ${file}`);
        
        const command = `git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch "${file}"' --prune-empty --tag-name-filter cat -- --all`;
        
        try {
          execSync(command, { stdio: 'inherit' });
        } catch (error) {
          console.log(`⚠️  File ${file} not found or already removed`);
        }
      }

      console.log('✅ git filter-branch cleaning completed');
      return true;
    } catch (error) {
      console.error('❌ git filter-branch cleaning failed:', error.message);
      return false;
    }
  }

  /**
   * Post-cleaning steps
   */
  performPostCleaningSteps() {
    console.log('\n🧹 Performing post-cleaning steps...');

    try {
      // Remove backup refs
      try {
        execSync('git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin', { stdio: 'ignore' });
      } catch (error) {
        console.log('⚠️  No backup refs to clean');
      }

      // Expire reflog
      execSync('git reflog expire --expire=now --all', { stdio: 'inherit' });

      // Garbage collect
      execSync('git gc --prune=now --aggressive', { stdio: 'inherit' });

      console.log('✅ Post-cleaning steps completed');
    } catch (error) {
      console.log('⚠️  Some post-cleaning steps failed:', error.message);
    }
  }

  /**
   * Generate comprehensive report
   */
  generateCleaningReport(method, success) {
    const reportFile = path.join(this.secureBackupsPath, `cleaning-report-${Date.now()}.md`);
    
    const report = `# Git History Cleaning Report

## Cleaning Information
- **Date**: ${new Date().toISOString()}
- **Method Used**: ${method}
- **Success**: ${success ? 'Yes' : 'No'}
- **Platform**: ${this.platform}
- **Repository**: ${process.cwd()}

## Files Targeted for Removal
- .env files (all variants)
- Firebase admin SDK keys
- Service account JSON files
- Private keys (.pem, .key)
- Sensitive configuration files

## Text Patterns Replaced
- Firebase API keys
- Stripe API keys (all types)
- SendGrid API keys
- Generic password/secret patterns

## Post-Cleaning Actions Required
1. **IMMEDIATE**: Force push changes
   \`\`\`bash
   git push --force-with-lease origin --all
   git push --force-with-lease origin --tags
   \`\`\`

2. **TEAM COORDINATION**: All team members must:
   - Delete local repository clones
   - Fresh clone from remote
   - Verify history is cleaned

3. **SECURITY**: Rotate all exposed credentials
   - Firebase API keys
   - Stripe API keys
   - SendGrid API keys
   - Any other exposed secrets

## Verification Commands
\`\`\`bash
# Check for remaining sensitive files
git log --all --name-only | grep -E "\\.(env|key|json)$"

# Check current repository size
git count-objects -vH

# Verify specific patterns are gone
git log --all -p | grep -i "AIza\\|pk_\\|sk_\\|SG\\."
\`\`\`

## Emergency Recovery
If issues arise, repository backup available at:
${this.secureBackupsPath}

## Notes
${success ? 
  'Cleaning completed successfully. Proceed with force push and team coordination.' : 
  'Cleaning encountered issues. Check logs and consider alternative methods.'}
`;

    fs.writeFileSync(reportFile, report);
    console.log(`📋 Cleaning report saved: ${reportFile}`);
    
    return reportFile;
  }

  /**
   * Main cleaning workflow
   */
  async performAdvancedCleaning() {
    try {
      console.log('🚀 Starting advanced git history cleaning...');

      // Check repository status
      try {
        execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
      } catch (error) {
        throw new Error('Not a git repository');
      }

      // Check for uncommitted changes
      const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      if (status) {
        throw new Error('Repository has uncommitted changes. Please commit or stash first.');
      }

      // Create backup
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.secureBackupsPath, `repo-backup-${timestamp}`);
      
      if (!fs.existsSync(this.secureBackupsPath)) {
        fs.mkdirSync(this.secureBackupsPath, { recursive: true });
      }

      console.log('\n📁 Creating repository backup...');
      execSync(`git clone --bare . "${backupPath}"`, { stdio: 'inherit' });
      console.log(`✅ Backup created: ${backupPath}`);

      // Check available tools
      const tools = this.checkAvailableTools();

      // Choose cleaning method
      let method = 'filter-branch';
      let success = false;

      if (tools.bfg) {
        const useBFG = await askQuestion('\nUse BFG Repo-Cleaner (recommended)? (y/N): ');
        if (useBFG.toLowerCase() === 'y') {
          method = 'bfg';
          success = await this.cleanWithBFG();
        }
      } else {
        const installBFG = await askQuestion('\nBFG not available. Install now? (y/N): ');
        if (installBFG.toLowerCase() === 'y') {
          const installed = await this.installBFG();
          if (installed) {
            method = 'bfg';
            success = await this.cleanWithBFG();
          }
        }
      }

      // Fallback to alternative methods
      if (!success && tools.filterRepo) {
        const useFilterRepo = await askQuestion('\nTry git filter-repo? (y/N): ');
        if (useFilterRepo.toLowerCase() === 'y') {
          method = 'filter-repo';
          success = await this.cleanWithFilterRepo();
        }
      }

      // Final fallback to filter-branch
      if (!success) {
        const useFilterBranch = await askQuestion('\nUse native git filter-branch? (y/N): ');
        if (useFilterBranch.toLowerCase() === 'y') {
          method = 'filter-branch';
          success = await this.cleanWithFilterBranch();
        }
      }

      // Post-cleaning steps
      if (success) {
        this.performPostCleaningSteps();
      }

      // Generate report
      const reportFile = this.generateCleaningReport(method, success);

      if (success) {
        console.log('\n🎉 Git history cleaning completed successfully!');
        console.log('\n⚠️  NEXT STEPS:');
        console.log('   1. Review the cleaning report');
        console.log('   2. Force push: git push --force-with-lease origin --all');
        console.log('   3. Coordinate with team for repository re-cloning');
        console.log('   4. Rotate all exposed credentials');
      } else {
        console.log('\n❌ Git history cleaning failed or was cancelled');
        console.log(`📋 Check report: ${reportFile}`);
        console.log(`🔄 Backup available: ${backupPath}`);
      }

    } catch (error) {
      console.error('❌ Advanced cleaning failed:', error.message);
    } finally {
      rl.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const cleaner = new AdvancedGitCleaner();
  cleaner.performAdvancedCleaning();
}

module.exports = { AdvancedGitCleaner };