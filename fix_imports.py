import os
import re

def fix_imports(directory):
    """Fix all @/firebase imports to @/lib/firebase"""
    count = 0
    
    for root, dirs, files in os.walk(directory):
        # Skip node_modules and .next directories
        if 'node_modules' in root or '.next' in root:
            continue
            
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                filepath = os.path.join(root, file)
                
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Replace @/firebase with @/lib/firebase
                    new_content = re.sub(
                        r'from\s+[\'"]@/firebase[\'"]',
                        "from '@/lib/firebase'",
                        content
                    )
                    
                    if new_content != content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Fixed: {filepath}")
                        count += 1
                        
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")
    
    return count

if __name__ == "__main__":
    src_dir = r"C:\Users\Yoga X380\Documents\ELIRA\elira\elira\src"
    fixed_count = fix_imports(src_dir)
    print(f"\nTotal files fixed: {fixed_count}")