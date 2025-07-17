class TShirtAnalyzer {
    constructor() {
        this.blockedTerms = new Set([
            // Disney
            'disney', 'mickey', 'minnie', 'donald', 'goofy', 'elsa', 'frozen', 'marvel',
            'avengers', 'spiderman', 'spider-man', 'batman', 'superman', 'hulk', 'thor',
            'iron man', 'captain america', 'black widow', 'deadpool', 'wolverine',
            
            // TV Shows & Movies
            'netflix', 'friends', 'breaking bad', 'game of thrones', 'stranger things',
            'harry potter', 'hogwarts', 'dumbledore', 'hermione', 'star wars',
            'darth vader', 'luke skywalker', 'princess leia', 'yoda', 'jedi',
            
            // Brands
            'nike', 'adidas', 'coca cola', 'pepsi', 'mcdonalds', 'burger king',
            'apple', 'samsung', 'google', 'microsoft', 'amazon', 'facebook',
            'instagram', 'twitter', 'tiktok', 'youtube', 'spotify',
            
            // Music & Artists
            'taylor swift', 'beyonce', 'kanye west', 'eminem', 'drake', 'rihanna',
            'lady gaga', 'justin bieber', 'ariana grande', 'ed sheeran',
            
            // Sports Teams
            'lakers', 'warriors', 'celtics', 'bulls', 'heat', 'spurs', 'knicks',
            'yankees', 'red sox', 'dodgers', 'giants', 'patriots', 'cowboys',
            'packers', 'steelers', 'eagles', 'chiefs', 'ravens', 'broncos',
            
            // Video Games
            'pokemon', 'pikachu', 'nintendo', 'mario', 'luigi', 'zelda', 'sonic',
            'minecraft', 'fortnite', 'call of duty', 'grand theft auto', 'fifa',
            
            // Generic copyrighted terms
            'tm', '®', '©', 'trademark', 'copyright', 'licensed', 'official'
        ]);

        this.winningKeywords = {
            seasonal: ['christmas', 'halloween', 'thanksgiving', 'easter', 'valentine',
                      'summer', 'winter', 'spring', 'fall', 'holiday', 'season'],
            motivational: ['motivation', 'inspire', 'success', 'hustle', 'grind',
                          'dream', 'achieve', 'goals', 'mindset', 'positive'],
            hobbies: ['fishing', 'hunting', 'camping', 'hiking', 'gardening',
                     'cooking', 'reading', 'travel', 'photography', 'art'],
            professions: ['teacher', 'nurse', 'doctor', 'engineer', 'lawyer',
                         'firefighter', 'police', 'chef', 'mechanic', 'programmer'],
            family: ['mom', 'dad', 'grandma', 'grandpa', 'sister', 'brother',
                    'family', 'mother', 'father', 'parent', 'child'],
            humor: ['funny', 'sarcastic', 'witty', 'humor', 'joke', 'laugh',
                   'comedy', 'hilarious', 'amusing', 'clever'],
            lifestyle: ['vintage', 'retro', 'minimalist', 'boho', 'hipster',
                       'aesthetic', 'trendy', 'stylish', 'cool', 'awesome'],
            animals: ['cat', 'dog', 'horse', 'bird', 'fish', 'pet', 'animal',
                     'wildlife', 'nature', 'rescue'],
            food: ['pizza', 'coffee', 'wine', 'beer', 'chocolate', 'food',
                  'cooking', 'baking', 'restaurant', 'chef'],
            sports: ['football', 'basketball', 'baseball', 'soccer', 'tennis',
                    'golf', 'volleyball', 'hockey', 'running', 'fitness']
        };

        this.originalData = [];
        this.analyzedData = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const downloadBtn = document.getElementById('downloadBtn');

        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.background = 'rgba(102, 126, 234, 0.1)';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.background = '';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.background = '';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });

        downloadBtn.addEventListener('click', () => this.downloadResults());
    }

    handleFileUpload(file) {
        if (!file.name.endsWith('.csv')) {
            alert('Please upload a CSV file.');
            return;
        }

        this.showLoading();

        Papa.parse(file, {
            header: true,
            complete: (results) => {
                this.originalData = results.data;
                this.analyzeData();
            },
            error: (error) => {
                console.error('Error parsing CSV:', error);
                alert('Error reading CSV file. Please check the file format.');
                this.hideLoading();
            }
        });
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('resultsSection').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    cleanText(text) {
        if (!text) return '';
        return String(text).toLowerCase().trim();
    }

    containsBlockedTerms(text) {
        const cleanText = this.cleanText(text);
        return Array.from(this.blockedTerms).some(term => cleanText.includes(term));
    }

    calculateWinningScore(row) {
        let score = 0;

        // Get text fields
        const textFields = ['title', 'description', 'keywords', 'niche', 'design_idea', 'product_title', 'name']
            .map(col => this.cleanText(row[col]))
            .filter(text => text);

        const combinedText = textFields.join(' ');

        // Keyword scoring
        let keywordScore = 0;
        Object.values(this.winningKeywords).forEach(keywords => {
            keywords.forEach(keyword => {
                if (combinedText.includes(keyword)) {
                    keywordScore += 1;
                }
            });
        });
        score += keywordScore;

        // BSR scoring
        const bsrColumns = ['bsr', 'best_seller_rank', 'rank', 'amazon_bsr', 'bestseller_rank'];
        let bsrScore = 0;
        for (const col of bsrColumns) {
            if (row[col] && !isNaN(row[col])) {
                const bsr = parseFloat(String(row[col]).replace(/,/g, ''));
                if (bsr > 0) {
                    if (bsr <= 1000) bsrScore = 100;
                    else if (bsr <= 5000) bsrScore = 80;
                    else if (bsr <= 10000) bsrScore = 60;
                    else if (bsr <= 50000) bsrScore = 40;
                    else if (bsr <= 100000) bsrScore = 20;
                    else if (bsr <= 500000) bsrScore = 10;
                    break;
                }
            }
        }
        score += bsrScore;

        // Rating scoring
        const ratingColumns = ['rating', 'star_rating', 'stars', 'average_rating', 'customer_rating'];
        let ratingScore = 0;
        for (const col of ratingColumns) {
            if (row[col] && !isNaN(row[col])) {
                const rating = parseFloat(row[col]);
                if (rating >= 4.5) ratingScore = 50;
                else if (rating >= 4.0) ratingScore = 35;
                else if (rating >= 3.5) ratingScore = 20;
                else if (rating >= 3.0) ratingScore = 10;
                break;
            }
        }
        score += ratingScore;

        // Reviews scoring
        const reviewColumns = ['reviews', 'review_count', 'total_reviews', 'num_reviews', 'number_of_reviews'];
        let reviewScore = 0;
        for (const col of reviewColumns) {
            if (row[col] && !isNaN(row[col])) {
                const reviews = parseFloat(String(row[col]).replace(/,/g, ''));
                if (reviews >= 1000) reviewScore = 40;
                else if (reviews >= 500) reviewScore = 30;
                else if (reviews >= 100) reviewScore = 20;
                else if (reviews >= 50) reviewScore = 15;
                else if (reviews >= 10) reviewScore = 10;
                else if (reviews >= 1) reviewScore = 5;
                break;
            }
        }
        score += reviewScore;

        // Length penalty
        if (combinedText.length > 200) {
            score -= 5;
        }

        return Math.max(score, 0);
    }

    identifyNiche(row) {
        const textFields = ['title', 'description', 'keywords', 'niche', 'design_idea']
            .map(col => this.cleanText(row[col]))
            .filter(text => text);

        const combinedText = textFields.join(' ');
        const nicheScores = {};

        Object.entries(this.winningKeywords).forEach(([category, keywords]) => {
            const score = keywords.reduce((sum, keyword) => {
                return sum + (combinedText.includes(keyword) ? 1 : 0);
            }, 0);
            if (score > 0) {
                nicheScores[category] = score;
            }
        });

        if (Object.keys(nicheScores).length === 0) {
            return 'general';
        }

        return Object.entries(nicheScores).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }

    analyzeData() {
        try {
            // Filter copyrighted content
            const cleanData = this.originalData.filter(row => {
                const textFields = ['title', 'description', 'keywords', 'niche', 'design_idea'];
                return !textFields.some(field => this.containsBlockedTerms(row[field]));
            });

            // Calculate scores and niches
            this.analyzedData = cleanData.map(row => ({
                ...row,
                winning_score: this.calculateWinningScore(row),
                niche_category: this.identifyNiche(row)
            }));

            // Sort by winning score
            this.analyzedData.sort((a, b) => b.winning_score - a.winning_score);

            // Filter winning ideas
            const winningIdeas = this.analyzedData.filter(item => item.winning_score > 5);

            this.displayResults(winningIdeas);
        } catch (error) {
            console.error('Error analyzing data:', error);
            alert('Error analyzing data. Please check your CSV format.');
        } finally {
            this.hideLoading();
        }
    }

    displayResults(winningIdeas) {
        // Update stats
        document.getElementById('totalItems').textContent = this.originalData.length;
        document.getElementById('winningItems').textContent = winningIdeas.length;
        document.getElementById('avgScore').textContent = winningIdeas.length > 0 ? 
            (winningIdeas.reduce((sum, item) => sum + item.winning_score, 0) / winningIdeas.length).toFixed(1) : '0';
        document.getElementById('filteredItems').textContent = this.originalData.length - this.analyzedData.length;

        // Display top niches
        this.displayTopNiches(winningIdeas);

        // Display top ideas
        this.displayTopIdeas(winningIdeas);

        // Display niche analysis
        this.displayNicheAnalysis(winningIdeas);

        // Display recommendations
        this.displayRecommendations(winningIdeas);

        // Show results section
        document.getElementById('resultsSection').style.display = 'block';
    }

    displayTopNiches(winningIdeas) {
        const nicheStats = {};
        
        winningIdeas.forEach(item => {
            const niche = item.niche_category;
            if (!nicheStats[niche]) {
                nicheStats[niche] = {
                    count: 0,
                    totalScore: 0,
                    maxScore: 0,
                    topPerformers: 0
                };
            }
            
            nicheStats[niche].count++;
            nicheStats[niche].totalScore += item.winning_score;
            nicheStats[niche].maxScore = Math.max(nicheStats[niche].maxScore, item.winning_score);
            if (item.winning_score >= 100) {
                nicheStats[niche].topPerformers++;
            }
        });

        const sortedNiches = Object.entries(nicheStats)
            .map(([niche, stats]) => ({
                niche,
                ...stats,
                avgScore: stats.totalScore / stats.count,
                opportunityScore: this.calculateOpportunityScore(stats)
            }))
            .sort((a, b) => b.opportunityScore - a.opportunityScore)
            .slice(0, 10);

        const topNichesHTML = sortedNiches.map(item => `
            <div class="niche-item">
                <div>
                    <div class="niche-name">${item.niche}</div>
                    <div class="niche-stats">
                        <span>${item.count} items</span>
                        <span>Avg: ${item.avgScore.toFixed(1)}</span>
                        <span>Max: ${item.maxScore.toFixed(1)}</span>
                    </div>
                </div>
                <div class="niche-score">${item.opportunityScore.toFixed(0)}</div>
            </div>
        `).join('');

        document.getElementById('topNiches').innerHTML = topNichesHTML;
    }

    calculateOpportunityScore(stats) {
        let score = 0;
        
        // Average score factor
        if (stats.totalScore / stats.count >= 50) score += 40;
        else if (stats.totalScore / stats.count >= 30) score += 30;
        else if (stats.totalScore / stats.count >= 20) score += 20;
        
        // Item count factor
        if (stats.count >= 20 && stats.count <= 100) score += 30;
        else if (stats.count >= 10 && stats.count <= 200) score += 20;
        else if (stats.count >= 5 && stats.count <= 50) score += 15;
        
        // Top performers factor
        if (stats.topPerformers >= 5) score += 20;
        else if (stats.topPerformers >= 2) score += 15;
        else if (stats.topPerformers >= 1) score += 10;
        
        // Max score factor
        if (stats.maxScore >= 150) score += 10;
        else if (stats.maxScore >= 100) score += 5;
        
        return score;
    }

    displayTopIdeas(winningIdeas) {
        const topIdeas = winningIdeas.slice(0, 20);
        
        const topIdeasHTML = topIdeas.map(item => {
            const title = item.title || item.product_title || item.name || 'No title';
            const description = item.description || item.design_idea || 'No description';
            const bsr = this.getBSR(item);
            const rating = this.getRating(item);
            const reviews = this.getReviews(item);
            
            return `
                <div class="idea-item">
                    <div class="idea-header">
                        <div class="idea-title">${this.truncateText(title, 60)}</div>
                        <div class="idea-score">${item.winning_score}</div>
                    </div>
                    <div class="idea-description">${this.truncateText(description, 120)}</div>
                    <div class="idea-stats">
                        <span class="niche-tag">${item.niche_category}</span>
                        ${bsr ? `<span>BSR: ${bsr}</span>` : ''}
                        ${rating ? `<span>Rating: ${rating}</span>` : ''}
                        ${reviews ? `<span>Reviews: ${reviews}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('topIdeas').innerHTML = topIdeasHTML;
    }

    displayNicheAnalysis(winningIdeas) {
        const nicheAnalysis = {};
        
        winningIdeas.forEach(item => {
            const niche = item.niche_category;
            if (!nicheAnalysis[niche]) {
                nicheAnalysis[niche] = {
                    items: [],
                    totalScore: 0,
                    avgBSR: 0,
                    avgRating: 0,
                    avgReviews: 0
                };
            }
            nicheAnalysis[niche].items.push(item);
            nicheAnalysis[niche].totalScore += item.winning_score;
        });

        // Calculate averages
        Object.keys(nicheAnalysis).forEach(niche => {
            const items = nicheAnalysis[niche].items;
            const count = items.length;
            
            nicheAnalysis[niche].avgScore = nicheAnalysis[niche].totalScore / count;
            
            // Calculate BSR average
            const bsrValues = items.map(item => this.getBSRValue(item)).filter(bsr => bsr > 0);
            nicheAnalysis[niche].avgBSR = bsrValues.length > 0 ? 
                bsrValues.reduce((sum, bsr) => sum + bsr, 0) / bsrValues.length : 0;
            
            // Calculate rating average
            const ratingValues = items.map(item => this.getRatingValue(item)).filter(rating => rating > 0);
            nicheAnalysis[niche].avgRating = ratingValues.length > 0 ? 
                ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length : 0;
            
            // Calculate reviews average
            const reviewValues = items.map(item => this.getReviewsValue(item)).filter(reviews => reviews > 0);
            nicheAnalysis[niche].avgReviews = reviewValues.length > 0 ? 
                reviewValues.reduce((sum, reviews) => sum + reviews, 0) / reviewValues.length : 0;
        });

        const sortedAnalysis = Object.entries(nicheAnalysis)
            .sort((a, b) => b[1].avgScore - a[1].avgScore)
            .slice(0, 10);

        const analysisHTML = sortedAnalysis.map(([niche, data]) => `
            <div class="analysis-item">
                <div class="analysis-header">
                    <div class="analysis-niche">${niche}</div>
                    <div class="analysis-count">${data.items.length} items</div>
                </div>
                <div class="analysis-metrics">
                    <div class="metric">
                        <span class="metric-label">Avg Score:</span>
                        <span class="metric-value">${data.avgScore.toFixed(1)}</span>
                    </div>
                    ${data.avgBSR > 0 ? `
                        <div class="metric">
                            <span class="metric-label">Avg BSR:</span>
                            <span class="metric-value">${this.formatNumber(data.avgBSR)}</span>
                        </div>
                    ` : ''}
                    ${data.avgRating > 0 ? `
                        <div class="metric">
                            <span class="metric-label">Avg Rating:</span>
                            <span class="metric-value">${data.avgRating.toFixed(1)}</span>
                        </div>
                    ` : ''}
                    ${data.avgReviews > 0 ? `
                        <div class="metric">
                            <span class="metric-label">Avg Reviews:</span>
                            <span class="metric-value">${this.formatNumber(data.avgReviews)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        document.getElementById('nicheAnalysis').innerHTML = analysisHTML;
    }

    displayRecommendations(winningIdeas) {
        const recommendations = this.generateRecommendations(winningIdeas);
        
        const recommendationsHTML = recommendations.map(rec => `
            <div class="recommendation-item">
                <div class="recommendation-header">
                    <div class="recommendation-icon">${rec.icon}</div>
                    <div class="recommendation-title">${rec.title}</div>
                </div>
                <div class="recommendation-description">${rec.description}</div>
                ${rec.examples ? `
                    <div class="recommendation-examples">
                        <strong>Examples:</strong> ${rec.examples.join(', ')}
                    </div>
                ` : ''}
            </div>
        `).join('');

        document.getElementById('recommendations').innerHTML = recommendationsHTML;
    }

    generateRecommendations(winningIdeas) {
        const recommendations = [];
        
        // Top niche recommendation
        const nicheStats = {};
        winningIdeas.forEach(item => {
            const niche = item.niche_category;
            if (!nicheStats[niche]) {
                nicheStats[niche] = { count: 0, totalScore: 0 };
            }
            nicheStats[niche].count++;
            nicheStats[niche].totalScore += item.winning_score;
        });

        const topNiche = Object.entries(nicheStats)
            .map(([niche, stats]) => ({ niche, ...stats, avgScore: stats.totalScore / stats.count }))
            .sort((a, b) => b.avgScore - a.avgScore)[0];

        if (topNiche) {
            recommendations.push({
                icon: '🎯',
                title: `Focus on ${topNiche.niche} niche`,
                description: `This niche has the highest average score (${topNiche.avgScore.toFixed(1)}) with ${topNiche.count} winning items. It shows consistent performance and good market demand.`
            });
        }

        // BSR recommendation
        const highBSRItems = winningIdeas.filter(item => {
            const bsr = this.getBSRValue(item);
            return bsr > 0 && bsr <= 10000;
        });

        if (highBSRItems.length > 0) {
            recommendations.push({
                icon: '📈',
                title: 'Target low BSR opportunities',
                description: `Found ${highBSRItems.length} items with BSR under 10,000. These represent proven market demand with good sales velocity.`,
                examples: highBSRItems.slice(0, 3).map(item => item.title || item.product_title || 'Untitled')
            });
        }

        // Seasonal recommendation
        const seasonalItems = winningIdeas.filter(item => item.niche_category === 'seasonal');
        if (seasonalItems.length > 0) {
            recommendations.push({
                icon: '🎃',
                title: 'Leverage seasonal trends',
                description: `${seasonalItems.length} seasonal items are performing well. Plan ahead for upcoming holidays and seasonal events.`,
                examples: seasonalItems.slice(0, 3).map(item => item.title || item.product_title || 'Untitled')
            });
        }

        // Review count recommendation
        const lowCompetitionItems = winningIdeas.filter(item => {
            const reviews = this.getReviewsValue(item);
            const score = item.winning_score;
            return reviews > 0 && reviews < 100 && score > 30;
        });

        if (lowCompetitionItems.length > 0) {
            recommendations.push({
                icon: '🚀',
                title: 'Low competition opportunities',
                description: `${lowCompetitionItems.length} items have good scores but low review counts (under 100). These may represent less competitive markets.`
            });
        }

        // Rating recommendation
        const highRatingItems = winningIdeas.filter(item => {
            const rating = this.getRatingValue(item);
            return rating >= 4.5;
        });

        if (highRatingItems.length > 0) {
            recommendations.push({
                icon: '⭐',
                title: 'Quality is key',
                description: `${highRatingItems.length} top items have 4.5+ star ratings. Focus on quality designs and customer satisfaction for long-term success.`
            });
        }

        return recommendations;
    }

    getBSR(item) {
        const bsrColumns = ['bsr', 'best_seller_rank', 'rank', 'amazon_bsr', 'bestseller_rank'];
        for (const col of bsrColumns) {
            if (item[col]) {
                const bsr = parseFloat(String(item[col]).replace(/,/g, ''));
                if (!isNaN(bsr) && bsr > 0) {
                    return this.formatNumber(bsr);
                }
            }
        }
        return null;
    }

    getBSRValue(item) {
        const bsrColumns = ['bsr', 'best_seller_rank', 'rank', 'amazon_bsr', 'bestseller_rank'];
        for (const col of bsrColumns) {
            if (item[col]) {
                const bsr = parseFloat(String(item[col]).replace(/,/g, ''));
                if (!isNaN(bsr) && bsr > 0) {
                    return bsr;
                }
            }
        }
        return 0;
    }

    getRating(item) {
        const ratingColumns = ['rating', 'star_rating', 'stars', 'average_rating', 'customer_rating'];
        for (const col of ratingColumns) {
            if (item[col]) {
                const rating = parseFloat(item[col]);
                if (!isNaN(rating) && rating > 0) {
                    return rating.toFixed(1);
                }
            }
        }
        return null;
    }

    getRatingValue(item) {
        const ratingColumns = ['rating', 'star_rating', 'stars', 'average_rating', 'customer_rating'];
        for (const col of ratingColumns) {
            if (item[col]) {
                const rating = parseFloat(item[col]);
                if (!isNaN(rating) && rating > 0) {
                    return rating;
                }
            }
        }
        return 0;
    }

    getReviews(item) {
        const reviewColumns = ['reviews', 'review_count', 'total_reviews', 'num_reviews', 'number_of_reviews'];
        for (const col of reviewColumns) {
            if (item[col]) {
                const reviews = parseFloat(String(item[col]).replace(/,/g, ''));
                if (!isNaN(reviews) && reviews > 0) {
                    return this.formatNumber(reviews);
                }
            }
        }
        return null;
    }

    getReviewsValue(item) {
        const reviewColumns = ['reviews', 'review_count', 'total_reviews', 'num_reviews', 'number_of_reviews'];
        for (const col of reviewColumns) {
            if (item[col]) {
                const reviews = parseFloat(String(item[col]).replace(/,/g, ''));
                if (!isNaN(reviews) && reviews > 0) {
                    return reviews;
                }
            }
        }
        return 0;
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        } else {
            return Math.round(num).toString();
        }
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    downloadResults() {
        if (this.analyzedData.length === 0) {
            alert('No data to download. Please analyze some data first.');
            return;
        }

        const csvContent = Papa.unparse(this.analyzedData);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'tshirt_analysis_results.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

// Initialize the analyzer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TShirtAnalyzer();
});