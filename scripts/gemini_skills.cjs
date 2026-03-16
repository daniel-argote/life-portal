const { exec } = require('child_process');

const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    const process = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      console.log(`stdout: ${stdout}`);
      resolve(stdout);
    });
  });
};

const supabase = {
  start: () => {
    console.log('Starting local Supabase environment...');
    return runCommand('npx supabase start');
  },
  new_migration: (name) => {
    if (!name) {
      return Promise.reject(new Error('Migration name is required.'));
    }
    console.log(`Creating new migration: ${name}...`);
    return runCommand(`npx supabase db diff -f ${name}`);
  },
  push: async () => {
    console.log('🚀 Starting Pre-flight Check...');
    
    try {
      console.log('🔍 Running Linter...');
      await runCommand('npm run lint');
      
      console.log('🔄 Syncing local database to verify migrations...');
      await runCommand('npx supabase db reset');
      
      console.log('✅ Pre-flight Check passed. Pushing to remote...');
      return await runCommand('npx supabase db push');
    } catch (error) {
      console.error('❌ Pre-flight Check failed! Push aborted.');
      throw error;
    }
  },
  reset: () => {
    console.log('Resetting local database to sync with migrations...');
    return runCommand('npx supabase db reset');
  },
  gen_types: () => {
    console.log('Generating TypeScript types from schema...');
    return runCommand('npx supabase gen types typescript --linked > src/types/supabase.ts');
  }
};

const skills = {
  supabase
};

module.exports = skills;

// This allows the script to be called from the command line
if (require.main === module) {
  const [skill, action, ...args] = process.argv.slice(2);
  if (skills[skill] && typeof skills[skill][action] === 'function') {
    skills[skill][action](...args).catch(err => {
      console.error(`Skill execution failed for ${skill}.${action}`);
      process.exit(1);
    });
  } else {
    console.error(`Skill or action not found: ${skill}.${action}`);
    process.exit(1);
  }
}
