/**
 * LinkManager 類別 - 負責管理連結資料與介面互動
 */
class LinkManager {
    /**
     * 建構子 - 初始化連結陣列
     */
    constructor() {
        this.links = [];  // 確保初始化為空陣列
        this.showTags = false;  // 預設隱藏標籤
        this.selectedTag = null;
        // 等待 DOM 載入完成後再初始化
        document.addEventListener('DOMContentLoaded', () => {
            this.init();
            this.setupTagsToggle();
            this.setupTagListToggle(); // 新增這行
        });
    }

    /**
     * 初始化方法
     * - 從 JSON 檔案載入連結資料
     * - 渲染連結列表
     * - 設定搜尋監聽器
     */
    async init() {
        try {
            const response = await fetch('data/links.json');
            let data = await response.json();
            
            // 確保資料是陣列格式
            if (!Array.isArray(data)) {
                // 如果是物件，檢查是否有 links 屬性
                if (data && typeof data === 'object' && Array.isArray(data.links)) {
                    data = data.links;
                } else {
                    console.error('Invalid data format in links.json');
                    data = [];
                }
            }

            // 驗證每個連結物件的格式
            this.links = data.filter(link => {
                const isValid = link && 
                              typeof link === 'object' &&
                              typeof link.name === 'string' &&
                              typeof link.url === 'string' &&
                              Array.isArray(link.tags);
                if (!isValid) {
                    console.warn('Skipping invalid link:', link);
                }
                return isValid;
            });

            // 確保搜尋容器存在
            const searchContainer = document.querySelector('.search-container');
            if (!searchContainer) {
                // 如果不存在就建立一個
                const header = document.querySelector('header') || document.body;
                const container = document.createElement('div');
                container.className = 'search-container';
                header.appendChild(container);
            }
            this.renderTagsList();
            this.renderLinks(this.links);
            this.setupSearchListener();
        } catch (error) {
            console.error('Error loading links:', error);
            this.links = [];
        }
    }

    /**
     * 設定搜尋功能
     * - 監聽搜尋輸入框的輸入事件
     * - 根據輸入內容過濾連結
     * - 可搜尋連結名稱與標籤
     */
    setupSearchListener() {
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredLinks = this.links.filter(link => {
                return link.name.toLowerCase().includes(searchTerm) ||
                       link.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            });
            this.renderLinks(filteredLinks);
        });
    }

    setupTagsToggle() {
        // 使用現有按鈕
        const toggleButton = document.getElementById('tagsToggleBtn');
        if (!toggleButton) return;

        // 設定初始狀態為顯示
        this.showTags = true;
        document.querySelectorAll('.tags').forEach(tagContainer => {
            tagContainer.classList.add('show');
        });

        // 綁定點擊事件
        toggleButton.addEventListener('click', () => {
            this.showTags = !this.showTags;
            toggleButton.classList.toggle('active');
            document.querySelectorAll('.tags').forEach(tagContainer => {
                tagContainer.classList.toggle('show');
            });
        });
    }

    setupTagListToggle() {
        const toggleButton = document.getElementById('tagListToggleBtn');
        if (!toggleButton) {
            console.error('tagListToggleBtn not found');
            return;
        }

        // 建立 MutationObserver 來監聽 DOM 變化
        const observer = new MutationObserver((mutations) => {
            const tagsList = document.querySelector('.tags-list');
            if (tagsList) {
                //console.log('Tags list found, setting up toggle');
                
                // 設定初始狀態
                tagsList.classList.remove('hide');
                toggleButton.classList.add('active');

                // 綁定點擊事件
                toggleButton.addEventListener('click', () => {
                    tagsList.classList.toggle('hide');
                    toggleButton.classList.toggle('active');
                });

                // 標籤列表找到後，停止觀察
                observer.disconnect();
            }
        });

        // 開始觀察 document.body 的子節點變化
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    renderLinks(links) {
        const linksContainer = document.getElementById('linksList');
        linksContainer.innerHTML = links.map((link, index) => `
            <div class="link-card">
                <div class="link-number">${index + 1}</div>
                <h3><a href="${link.url}" target="_blank">${link.name}</a></h3>
                <div class="tags ${this.showTags ? 'show' : ''}">
                    ${link.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        `).join('');
    }

    // 新增取得唯一標籤列表的方法
    getAllUniqueTags() {
        // 加入安全檢查
        if (!Array.isArray(this.links)) {
            console.error('Links is not an array');
            return [];
        }

        const tagsSet = new Set();
        this.links.forEach(link => {
            if (link && Array.isArray(link.tags)) {
                link.tags.forEach(tag => tagsSet.add(tag));
            }
        });
        return Array.from(tagsSet).sort();
    }

    // 新增渲染標籤列表的方法
    renderTagsList() {
        const searchContainer = document.querySelector('.search-container');
        if (!searchContainer) return; // 安全檢查

        // 移除舊的標籤列表（如果存在）
        const oldTagsList = document.querySelector('.tags-list');
        if (oldTagsList) {
            oldTagsList.remove();
        }

        const tagsListContainer = document.createElement('div');
        tagsListContainer.className = 'tags-list';
        
        const tags = this.getAllUniqueTags();
        tagsListContainer.innerHTML = tags.map(tag => `
            <span class="tag-filter${this.selectedTag === tag ? ' active' : ''}" 
                  data-tag="${tag}">
                ${tag}
            </span>
        `).join('');

        searchContainer.insertAdjacentElement('afterend', tagsListContainer);

        // 綁定點擊事件
        tagsListContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-filter')) {
                const tag = e.target.dataset.tag;
                this.filterByTag(tag);
            }
        });
    }

    // 新增標籤篩選方法
    filterByTag(tag) {
        if (this.selectedTag === tag) {
            this.selectedTag = null;
            this.renderLinks(this.links);
        } else {
            this.selectedTag = tag;
            const filteredLinks = this.links.filter(link => 
                link.tags.includes(tag)
            );
            this.renderLinks(filteredLinks);
        }
        
        // 更新標籤的選中狀態
        document.querySelectorAll('.tag-filter').forEach(tagEl => {
            tagEl.classList.toggle('active', tagEl.dataset.tag === this.selectedTag);
        });
    }
}

new LinkManager();

// 在 app.js 中加入
const gridViewBtn = document.getElementById('gridView');
const listViewBtn = document.getElementById('listView');
const linksList = document.getElementById('linksList');

// 切換視圖
function toggleView(viewType) {
    if (viewType === 'grid') {
        linksList.classList.remove('links-list');
        linksList.classList.add('links-grid');
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
    } else {
        linksList.classList.remove('links-grid');
        linksList.classList.add('links-list');
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
    }
}

// 綁定事件
gridViewBtn.addEventListener('click', () => toggleView('grid'));
listViewBtn.addEventListener('click', () => toggleView('list'));