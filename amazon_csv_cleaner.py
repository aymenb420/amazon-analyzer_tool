import pandas as pd
import re
import csv
from collections import Counter
import numpy as np

class TopNichesAnalyzer:
    """Class to analyze and rank top performing niches"""
    
    def __init__(self, df):
        self.df = df
        self.niche_performance = {}
        self.analyze_niches()
    
    def analyze_niches(self):
        """Analyze performance metrics for each niche"""
        for niche in self.df['niche_category'].unique():
            niche_data = self.df[self.df['niche_category'] == niche]
            
            # Calculate comprehensive niche metrics
            metrics = {
                'item_count': len(niche_data),
                'avg_winning_score': niche_data['winning_score'].mean(),
                'max_winning_score': niche_data['winning_score'].max(),
                'avg_bsr': self._get_avg_metric(niche_data, ['bsr', 'best_seller_rank', 'rank', 'amazon_bsr']),
                'avg_rating': self._get_avg_metric(niche_data, ['rating', 'star_rating', 'stars', 'average_rating']),
                'avg_reviews': self._get_avg_metric(niche_data, ['reviews', 'review_count', 'total_reviews', 'num_reviews']),
                'top_performers': len(niche_data[niche_data['winning_score'] >= 100]),  # Items with score >= 100
                'market_opportunity': self._calculate_market_opportunity(niche_data)
            }
            
            self.niche_performance[niche] = metrics
    
    def _get_avg_metric(self, niche_data, column_names):
        """Get average of a metric across multiple possible column names"""
        for col in column_names:
            if col in niche_data.columns:
                values = niche_data[col].dropna()
                if len(values) > 0:
                    return values.mean()
        return 0
    
    def _calculate_market_opportunity(self, niche_data):
        """Calculate market opportunity score for niche"""
        # Factors: high ratings, decent review count, good BSR
        score = 0
        
        # Rating factor
        avg_rating = self._get_avg_metric(niche_data, ['rating', 'star_rating', 'stars', 'average_rating'])
        if avg_rating >= 4.0:
            score += 30
        elif avg_rating >= 3.5:
            score += 20
        
        # Review count factor
        avg_reviews = self._get_avg_metric(niche_data, ['reviews', 'review_count', 'total_reviews', 'num_reviews'])
        if avg_reviews >= 100:
            score += 25
        elif avg_reviews >= 50:
            score += 15
        elif avg_reviews >= 10:
            score += 10
        
        # BSR factor (lower is better)
        avg_bsr = self._get_avg_metric(niche_data, ['bsr', 'best_seller_rank', 'rank', 'amazon_bsr'])
        if avg_bsr > 0:
            if avg_bsr <= 50000:
                score += 40
            elif avg_bsr <= 100000:
                score += 25
            elif avg_bsr <= 500000:
                score += 15
        
        # Item count factor (not too saturated, not too empty)
        item_count = len(niche_data)
        if 20 <= item_count <= 100:
            score += 15
        elif 10 <= item_count <= 200:
            score += 10
        elif item_count >= 5:
            score += 5
        
        return score
    
    def get_top_niches(self, n=10):
        """Get top N performing niches"""
        # Sort by market opportunity score, then by average winning score
        sorted_niches = sorted(
            self.niche_performance.items(),
            key=lambda x: (x[1]['market_opportunity'], x[1]['avg_winning_score']),
            reverse=True
        )
        
        return sorted_niches[:n]
    
    def print_top_niches_report(self, n=10):
        """Print detailed report of top performing niches"""
        print(f"\n🏆 TOP {n} PERFORMING NICHES")
        print("=" * 80)
        
        top_niches = self.get_top_niches(n)
        
        for i, (niche, metrics) in enumerate(top_niches, 1):
            print(f"\n{i}. {niche.upper()}")
            print("-" * 40)
            print(f"Market Opportunity Score: {metrics['market_opportunity']:.1f}")
            print(f"Average Winning Score:    {metrics['avg_winning_score']:.1f}")
            print(f"Items in Niche:           {metrics['item_count']}")
            print(f"Top Performers (≥100):    {metrics['top_performers']}")
            print(f"Average BSR:              {metrics['avg_bsr']:,.0f}" if metrics['avg_bsr'] > 0 else "Average BSR:              N/A")
            print(f"Average Rating:           {metrics['avg_rating']:.1f}" if metrics['avg_rating'] > 0 else "Average Rating:           N/A")
            print(f"Average Reviews:          {metrics['avg_reviews']:.0f}" if metrics['avg_reviews'] > 0 else "Average Reviews:          N/A")
        
        return top_niches
    
    def get_niche_recommendations(self, top_niches):
        """Generate actionable recommendations for top niches"""
        print(f"\n💡 NICHE RECOMMENDATIONS")
        print("=" * 50)
        
        for i, (niche, metrics) in enumerate(top_niches[:5], 1):
            opportunity_level = "HIGH" if metrics['market_opportunity'] >= 80 else "MEDIUM" if metrics['market_opportunity'] >= 60 else "LOW"
            
            print(f"\n{i}. {niche.upper()} - {opportunity_level} OPPORTUNITY")
            
            if metrics['avg_bsr'] > 0 and metrics['avg_bsr'] <= 50000:
                print("   ✓ Strong BSR performance - proven market demand")
            elif metrics['avg_bsr'] > 500000:
                print("   ⚠ High BSR - consider market saturation")
            
            if metrics['avg_rating'] >= 4.0:
                print("   ✓ High customer satisfaction")
            elif metrics['avg_rating'] < 3.5:
                print("   ⚠ Room for quality improvement")
            
            if metrics['item_count'] < 20:
                print("   ✓ Low competition - good entry opportunity")
            elif metrics['item_count'] > 100:
                print("   ⚠ High competition - need strong differentiation")
            
            if metrics['top_performers'] > 0:
                print(f"   ✓ {metrics['top_performers']} proven winners in this niche")


class TShirtAnalyzer:
    def __init__(self):
        # Common copyrighted/trademarked terms to filter out
        self.blocked_terms = {
            # Disney
            'disney', 'mickey', 'minnie', 'donald', 'goofy', 'elsa', 'frozen', 'marvel',
            'avengers', 'spiderman', 'spider-man', 'batman', 'superman', 'hulk', 'thor',
            'iron man', 'captain america', 'black widow', 'deadpool', 'wolverine',
            
            # TV Shows & Movies
            'netflix', 'friends', 'breaking bad', 'game of thrones', 'stranger things',
            'harry potter', 'hogwarts', 'dumbledore', 'hermione', 'star wars',
            'darth vader', 'luke skywalker', 'princess leia', 'yoda', 'jedi',
            
            # Brands
            'nike', 'adidas', 'coca cola', 'pepsi', 'mcdonalds', 'burger king',
            'apple', 'samsung', 'google', 'microsoft', 'amazon', 'facebook',
            'instagram', 'twitter', 'tiktok', 'youtube', 'spotify',
            
            # Music & Artists
            'taylor swift', 'beyonce', 'kanye west', 'eminem', 'drake', 'rihanna',
            'lady gaga', 'justin bieber', 'ariana grande', 'ed sheeran',
            
            # Sports Teams (Major ones)
            'lakers', 'warriors', 'celtics', 'bulls', 'heat', 'spurs', 'knicks',
            'yankees', 'red sox', 'dodgers', 'giants', 'patriots', 'cowboys',
            'packers', 'steelers', 'eagles', 'chiefs', 'ravens', 'broncos',
            
            # Video Games
            'pokemon', 'pikachu', 'nintendo', 'mario', 'luigi', 'zelda', 'sonic',
            'minecraft', 'fortnite', 'call of duty', 'grand theft auto', 'fifa',
            
            # Generic copyrighted terms
            'tm', '®', '©', 'trademark', 'copyright', 'licensed', 'official'
        }
        
        # High-performing niches and keywords
        self.winning_keywords = {
            'seasonal': ['christmas', 'halloween', 'thanksgiving', 'easter', 'valentine',
                        'summer', 'winter', 'spring', 'fall', 'holiday', 'season'],
            'motivational': ['motivation', 'inspire', 'success', 'hustle', 'grind',
                           'dream', 'achieve', 'goals', 'mindset', 'positive'],
            'hobbies': ['fishing', 'hunting', 'camping', 'hiking', 'gardening',
                       'cooking', 'reading', 'travel', 'photography', 'art'],
            'professions': ['teacher', 'nurse', 'doctor', 'engineer', 'lawyer',
                          'firefighter', 'police', 'chef', 'mechanic', 'programmer'],
            'family': ['mom', 'dad', 'grandma', 'grandpa', 'sister', 'brother',
                      'family', 'mother', 'father', 'parent', 'child'],
            'humor': ['funny', 'sarcastic', 'witty', 'humor', 'joke', 'laugh',
                     'comedy', 'hilarious', 'amusing', 'clever'],
            'lifestyle': ['vintage', 'retro', 'minimalist', 'boho', 'hipster',
                         'aesthetic', 'trendy', 'stylish', 'cool', 'awesome'],
            'animals': ['cat', 'dog', 'horse', 'bird', 'fish', 'pet', 'animal',
                       'wildlife', 'nature', 'rescue'],
            'food': ['pizza', 'coffee', 'wine', 'beer', 'chocolate', 'food',
                    'cooking', 'baking', 'restaurant', 'chef'],
            'sports': ['football', 'basketball', 'baseball', 'soccer', 'tennis',
                      'golf', 'volleyball', 'hockey', 'running', 'fitness']
        }
    
    def load_csv(self, file_path):
        """Load CSV file and return DataFrame"""
        try:
            df = pd.read_csv(file_path)
            print(f"✓ Loaded {len(df)} rows from {file_path}")
            
            # DEBUG: Show column names and sample data
            print(f"\n📋 COLUMN NAMES FOUND:")
            for i, col in enumerate(df.columns, 1):
                print(f"  {i}. {col}")
            
            print(f"\n📊 SAMPLE DATA (first 3 rows):")
            print(df.head(3).to_string())
            
            print(f"\n🔍 DATA TYPES:")
            print(df.dtypes)
            
            return df
        except Exception as e:
            print(f"✗ Error loading CSV: {e}")
            return None
    
    def clean_text(self, text):
        """Clean and normalize text"""
        if pd.isna(text):
            return ""
        return str(text).lower().strip()
    
    def contains_blocked_terms(self, text):
        """Check if text contains copyrighted/trademarked terms"""
        text_clean = self.clean_text(text)
        for term in self.blocked_terms:
            if term in text_clean:
                return True
        return False
    
    def calculate_winning_score(self, row):
        """Calculate winning potential score based on BSR, reviews, and rating"""
        score = 0
        
        # DEBUG: Print available columns for first few rows
        if hasattr(self, 'debug_count') and self.debug_count < 3:
            print(f"\n🔍 DEBUG Row {self.debug_count + 1} - Available columns: {list(row.index)}")
            self.debug_count += 1
        elif not hasattr(self, 'debug_count'):
            self.debug_count = 0
        
        # Get text fields (adjust column names based on your CSV structure)
        text_fields = []
        for col in ['title', 'description', 'keywords', 'niche', 'design_idea', 'product_title', 'name']:
            if col in row.index:
                text_fields.append(self.clean_text(row[col]))
        
        combined_text = ' '.join(text_fields)
        
        # Score based on winning keywords (reduced weight)
        keyword_score = 0
        for category, keywords in self.winning_keywords.items():
            category_score = sum(1 for keyword in keywords if keyword in combined_text)
            keyword_score += category_score * 1  # Reduced weight factor
        
        score += keyword_score
        
        # PRIMARY METRICS - Higher weight for BSR, reviews, rating
        
        # BSR Score (lower BSR = better ranking = higher score)
        bsr_columns = ['bsr', 'best_seller_rank', 'rank', 'amazon_bsr', 'bestseller_rank']
        bsr_score = 0
        for col in bsr_columns:
            if col in row.index and pd.notna(row[col]):
                try:
                    bsr = float(str(row[col]).replace(',', ''))  # Remove commas
                    if bsr > 0:
                        # Convert BSR to score (lower BSR = higher score)
                        if bsr <= 1000:
                            bsr_score = 100  # Top 1000 gets max points
                        elif bsr <= 5000:
                            bsr_score = 80
                        elif bsr <= 10000:
                            bsr_score = 60
                        elif bsr <= 50000:
                            bsr_score = 40
                        elif bsr <= 100000:
                            bsr_score = 20
                        elif bsr <= 500000:
                            bsr_score = 10
                        # BSR > 500k gets 0 points
                        
                        # DEBUG: Print BSR info for first few rows
                        if hasattr(self, 'debug_count') and self.debug_count <= 3:
                            print(f"  BSR found: {bsr} -> Score: {bsr_score}")
                    break
                except:
                    pass
        
        score += bsr_score
        
        # Rating Score (4.0+ ratings get significant bonus)
        rating_columns = ['rating', 'star_rating', 'stars', 'average_rating', 'customer_rating']
        rating_score = 0
        for col in rating_columns:
            if col in row.index and pd.notna(row[col]):
                try:
                    rating = float(row[col])
                    if rating >= 4.5:
                        rating_score = 50
                    elif rating >= 4.0:
                        rating_score = 35
                    elif rating >= 3.5:
                        rating_score = 20
                    elif rating >= 3.0:
                        rating_score = 10
                    # Below 3.0 gets 0 points
                    
                    # DEBUG: Print rating info for first few rows
                    if hasattr(self, 'debug_count') and self.debug_count <= 3:
                        print(f"  Rating found: {rating} -> Score: {rating_score}")
                    break
                except:
                    pass
        
        score += rating_score
        
        # Reviews Score (more reviews = more validation)
        review_columns = ['reviews', 'review_count', 'total_reviews', 'num_reviews', 'number_of_reviews']
        review_score = 0
        for col in review_columns:
            if col in row.index and pd.notna(row[col]):
                try:
                    reviews = float(str(row[col]).replace(',', ''))  # Remove commas
                    if reviews >= 1000:
                        review_score = 40
                    elif reviews >= 500:
                        review_score = 30
                    elif reviews >= 100:
                        review_score = 20
                    elif reviews >= 50:
                        review_score = 15
                    elif reviews >= 10:
                        review_score = 10
                    elif reviews >= 1:
                        review_score = 5
                    # 0 reviews gets 0 points
                    
                    # DEBUG: Print review info for first few rows
                    if hasattr(self, 'debug_count') and self.debug_count <= 3:
                        print(f"  Reviews found: {reviews} -> Score: {review_score}")
                    break
                except:
                    pass
        
        score += review_score
        
        # Length penalty (very long titles often perform worse)
        if len(combined_text) > 200:
            score -= 5
        
        # DEBUG: Print total score for first few rows
        if hasattr(self, 'debug_count') and self.debug_count <= 3:
            print(f"  Total Score: {score} (Keyword: {keyword_score}, BSR: {bsr_score}, Rating: {rating_score}, Reviews: {review_score})")
        
        return max(score, 0)
    
    def identify_niche(self, row):
        """Identify the primary niche category"""
        text_fields = []
        for col in ['title', 'description', 'keywords', 'niche', 'design_idea']:
            if col in row.index:
                text_fields.append(self.clean_text(row[col]))
        
        combined_text = ' '.join(text_fields)
        
        niche_scores = {}
        for category, keywords in self.winning_keywords.items():
            score = sum(1 for keyword in keywords if keyword in combined_text)
            if score > 0:
                niche_scores[category] = score
        
        if niche_scores:
            return max(niche_scores.items(), key=lambda x: x[1])[0]
        return 'general'
    
    def analyze_data(self, df):
        """Main analysis function"""
        print("\n🔍 Analyzing t-shirt data...")
        
        # Filter out copyrighted content
        initial_count = len(df)
        clean_df = df[~df.apply(lambda row: any(
            self.contains_blocked_terms(row[col]) for col in df.columns 
            if col in ['title', 'description', 'keywords', 'niche', 'design_idea']
        ), axis=1)]
        
        filtered_count = initial_count - len(clean_df)
        print(f"✓ Filtered out {filtered_count} copyrighted/trademarked items")
        
        # Calculate winning scores
        clean_df['winning_score'] = clean_df.apply(self.calculate_winning_score, axis=1)
        clean_df['niche_category'] = clean_df.apply(self.identify_niche, axis=1)
        
        # Filter for winning ideas (adjust threshold based on data)
        score_threshold = 5  # Lowered threshold for initial testing
        winning_df = clean_df[clean_df['winning_score'] > score_threshold].copy()
        winning_df = winning_df.sort_values('winning_score', ascending=False)
        
        print(f"✓ Identified {len(winning_df)} winning t-shirt ideas (score > {score_threshold})")
        
        # Show score distribution
        print(f"\n📊 SCORE DISTRIBUTION:")
        print(f"  Max Score: {clean_df['winning_score'].max():.1f}")
        print(f"  Average Score: {clean_df['winning_score'].mean():.1f}")
        print(f"  Min Score: {clean_df['winning_score'].min():.1f}")
        print(f"  Scores > 20: {len(clean_df[clean_df['winning_score'] > 20])}")
        print(f"  Scores > 10: {len(clean_df[clean_df['winning_score'] > 10])}")
        print(f"  Scores > 5: {len(clean_df[clean_df['winning_score'] > 5])}")
        
        return winning_df
    
    def generate_niche_report(self, df):
        """Generate niche analysis report"""
        print("\n📊 Niche Analysis Report:")
        print("=" * 50)
        
        niche_stats = df.groupby('niche_category').agg({
            'winning_score': ['count', 'mean', 'max'],
            'niche_category': 'count'
        }).round(2)
        
        niche_summary = df['niche_category'].value_counts()
        
        print(f"{'Niche':<15} {'Count':<8} {'Avg Score':<12} {'Max Score':<10}")
        print("-" * 50)
        
        for niche in niche_summary.index:
            count = niche_summary[niche]
            avg_score = df[df['niche_category'] == niche]['winning_score'].mean()
            max_score = df[df['niche_category'] == niche]['winning_score'].max()
            print(f"{niche:<15} {count:<8} {avg_score:<12.1f} {max_score:<10.1f}")
        
        return niche_summary
    
    def save_results(self, df, output_file='winning_tshirt_ideas.csv'):
        """Save cleaned results to CSV"""
        try:
            # Select most relevant columns for output
            output_columns = ['winning_score', 'niche_category']
            
            # Add original columns that exist
            for col in df.columns:
                if col not in output_columns:
                    output_columns.append(col)
            
            # Reorder columns
            df_output = df[output_columns].copy()
            
            # Save to CSV
            df_output.to_csv(output_file, index=False)
            print(f"✓ Saved {len(df_output)} winning ideas to {output_file}")
            
            return output_file
        except Exception as e:
            print(f"✗ Error saving results: {e}")
            return None
    
    def process_file(self, input_file, output_file='winning_tshirt_ideas.csv'):
        """Main processing function"""
        print(f"🚀 Processing {input_file}...")
        
        # Load data
        df = self.load_csv(input_file)
        if df is None:
            return None
        
        # Analyze data
        winning_df = self.analyze_data(df)
        
        # Generate report
        niche_stats = self.generate_niche_report(winning_df)
        
        # Analyze top performing niches
        top_niches_analyzer = TopNichesAnalyzer(winning_df)
        top_niches = top_niches_analyzer.print_top_niches_report(10)
        top_niches_analyzer.get_niche_recommendations(top_niches)
        
        # Save results
        output_file = self.save_results(winning_df, output_file)
        
        print(f"\n✅ Processing complete!")
        print(f"📁 Output saved to: {output_file}")
        
        return winning_df

def main():
    """Main function to run the analyzer"""
    analyzer = TShirtAnalyzer()
    
    # METHOD 1: Direct file path (uncomment and modify this line)
    # input_file = "your_tshirt_data.csv"  # Replace with your CSV file name
    
    # METHOD 2: Interactive input (current default)
    print("🎯 T-Shirt Analyzer - Choose your CSV input method:")
    print("1. Enter file path manually")
    print("2. Use default file name 'tshirt_data.csv'")
    print("3. Drag and drop file path")
    
    choice = input("Choose option (1-3): ").strip()
    
    if choice == "2":
        input_file = "tshirt_data.csv"
        print(f"Looking for: {input_file}")
    elif choice == "3":
        print("Drag your CSV file here and press Enter:")
        input_file = input().strip().strip('"')  # Remove quotes if present
    else:
        input_file = input("Enter the path to your CSV file: ").strip()
    
    output_file = input("Enter output file name (or press Enter for default): ").strip()
    
    if not output_file:
        output_file = 'winning_tshirt_ideas.csv'
    
    # Process the file
    results = analyzer.process_file(input_file, output_file)
    
    if results is not None:
        print(f"\n🎯 Top 10 Winning Ideas:")
        print("-" * 60)
        
        # Display top results
        top_10 = results.head(10)
        for idx, row in top_10.iterrows():
            title = row.get('title', 'N/A')
            score = row['winning_score']
            niche = row['niche_category']
            print(f"{score:>6.1f} | {niche:<12} | {title}")
        
        print(f"\n💡 Recommendations:")
        print(f"• Focus on top 3 niches from the detailed analysis above")
        print(f"• Prioritize items with BSR < 50,000 and rating > 4.0")
        print(f"• Target niches with 10-100 items (sweet spot for competition)")
        print(f"• Average winning score: {results['winning_score'].mean():.1f}")
        print(f"• Look for gaps in high-opportunity niches")
        print(f"• {len(results)} clean, copyright-free ideas ready to use!")

if __name__ == "__main__":
    main()