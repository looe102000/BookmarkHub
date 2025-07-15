// debounce function
function debounce(fn, delay) {
    let timer = null;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// 從 Vue 3 引入需要的 API
const { createApp, ref, computed, watch } = Vue

// 創建 Vue 應用實例
const app = createApp({
    // 使用 Composition API 的 setup 函數
    setup() {
        // 響應式狀態宣告
        const links = ref([])          // 儲存所有書籤連結
        const searchTerm = ref('')     // 搜尋關鍵字
        const debouncedSearchTerm = ref('');
        const showTags = ref(true)     // 控制標籤的顯示狀態
        const showTagList = ref(true)  // 控制標籤列表的顯示狀態
        const selectedTag = ref(null)  // 目前選中的標籤
        const viewType = ref('grid')   // 視圖類型：grid(網格) 或 list(列表)
        const currentPage = ref(1)
        const pageSize = 20
        const pageCount = computed(() => Math.ceil(filteredLinks.value.length / pageSize))
        const pagedLinks = computed(() => {
            const start = (currentPage.value - 1) * pageSize
            return filteredLinks.value.slice(start, start + pageSize)
        })
        const goToPage = (page) => {
            if (page >= 1 && page <= pageCount.value) {
                currentPage.value = page
            }
        }

        // 初始化：從 JSON 檔案載入書籤數據
        fetch('data/links.json')
            .then(response => response.json())
            .then(data => {
                // 將載入的數據存入響應式參考
                links.value = data.links || []  // 如果沒有數據則使用空陣列
            })
            .catch(error => console.error('Error loading links:', error))

        // 計算屬性：獲取所有不重複的標籤
        const uniqueTags = computed(() => {
            const tagsSet = new Set()  // 使用 Set 來去除重複標籤
            links.value.forEach(link => {
                link.tags.forEach(tag => tagsSet.add(tag))  // 收集所有標籤
            })
            return Array.from(tagsSet).sort()  // 轉換為排序後的陣列
        })

        // 過濾連結
        const filteredLinks = computed(() => {
            let result = links.value

            // 使用 debouncedSearchTerm
            if (debouncedSearchTerm.value) {
                const term = debouncedSearchTerm.value.toLowerCase()
                result = result.filter(link => 
                    link.name.toLowerCase().includes(term) ||
                    link.tags.some(tag => tag.toLowerCase().includes(term))
                )
            }

            // 標籤過濾
            if (selectedTag.value) {
                result = result.filter(link => 
                    link.tags.includes(selectedTag.value)
                )
            }

            return result
        })

        // === 用戶介面控制方法 ===

        /**
         * 切換標籤的顯示狀態
         * 當使用者點擊標籤開關按鈕時觸發
         * 如果標籤目前顯示，則隱藏；如果隱藏，則顯示
         */
        const toggleTags = () => {
            showTags.value = !showTags.value
        }

        /**
         * 切換標籤列表的顯示狀態
         * 當使用者點擊標籤列表開關按鈕時觸發
         * 如果標籤列表目前顯示，則隱藏；如果隱藏，則顯示
         */
        const toggleTagList = () => {
            showTagList.value = !showTagList.value
        }

        /**
         * 根據選擇的標籤過濾書籤
         * @param {string} tag - 要過濾的標籤名稱
         * 如果點擊已選中的標籤，則取消選中（返回全部書籤）
         * 如果點擊新標籤，則選中該標籤（只顯示包含該標籤的書籤）
         */
        const filterByTag = (tag) => {
            selectedTag.value = selectedTag.value === tag ? null : tag
        }

        /**
         * 編輯書籤
         * 彈窗修改 name/desc，並即時更新
         */
        const editLink = (link) => {
            const newName = prompt('請輸入新的名稱', link.name)
            if (newName !== null && newName.trim() !== '') {
                link.name = newName.trim()
            }
            const newDesc = prompt('請輸入新的描述', link.desc || '')
            if (newDesc !== null) {
                link.desc = newDesc.trim()
            }
        }

        /**
         * 刪除書籤
         * 直接移除 links 陣列中的該項
         */
        const deleteLink = (link) => {
            const idx = links.value.findIndex(l => l.id === link.id)
            if (idx !== -1 && confirm('確定要刪除這個書籤嗎？')) {
                links.value.splice(idx, 1)
            }
        }

        // debounce searchTerm update
        watch(searchTerm, debounce((val) => {
            debouncedSearchTerm.value = val;
        }, 300));

        return {
            links,
            searchTerm,
            showTags,
            showTagList,
            selectedTag,
            viewType,
            currentPage,
            pageCount,
            pagedLinks,
            goToPage,
            uniqueTags,
            filteredLinks,
            toggleTags,
            toggleTagList,
            filterByTag,
            editLink,
            deleteLink
        }
    }
})

app.mount('#app')