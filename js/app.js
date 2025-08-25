// TODO アプリケーション
class TodoApp {
    constructor() {
        // アプリケーション状態
        this.state = {
            todos: [],
            currentFilter: 'all',
            editingId: null
        };

        // DOM要素の参照
        this.elements = {
            todoForm: document.getElementById('todoForm'),
            todoInput: document.getElementById('todoInput'),
            todoList: document.getElementById('todoList'),
            emptyState: document.getElementById('emptyState'),
            filterControls: document.getElementById('filterControls'),
            todoCount: document.getElementById('todoCount'),
            clearCompleted: document.getElementById('clearCompleted')
        };

        // 初期化
        this.init();
    }

    // 初期化メソッド
    init() {
        this.loadFromStorage();
        this.attachEventListeners();
        this.handleRouteChange();
        this.render();
    }

    // LocalStorageからデータを読み込み
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('todoApp_todos');
            if (stored) {
                const todos = JSON.parse(stored);
                // データ検証
                if (Array.isArray(todos)) {
                    this.state.todos = todos.filter(this.validateTodo);
                }
            }
        } catch (error) {
            console.error('Failed to load todos from localStorage:', error);
            this.state.todos = [];
        }
    }

    // TODOデータの検証
    validateTodo(todo) {
        return (
            todo &&
            typeof todo.id === 'string' &&
            typeof todo.text === 'string' &&
            typeof todo.completed === 'boolean' &&
            typeof todo.createdAt === 'number'
        );
    }

    // LocalStorageにデータを保存
    saveToStorage() {
        try {
            localStorage.setItem('todoApp_todos', JSON.stringify(this.state.todos));
        } catch (error) {
            console.error('Failed to save todos to localStorage:', error);
        }
    }

    // ユニークIDの生成
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // イベントリスナーの設定
    attachEventListeners() {
        // フォーム送信
        this.elements.todoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });

        // フィルターコントロール
        this.elements.filterControls.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-controls__link')) {
                e.preventDefault();
                const filter = e.target.dataset.filter;
                this.setFilter(filter);
                // URLハッシュを更新
                window.location.hash = filter === 'all' ? '#/' : `#/${filter}`;
            }
        });

        // 完了済み削除ボタン
        this.elements.clearCompleted.addEventListener('click', () => {
            this.clearCompleted();
        });

        // ルート変更の監視
        window.addEventListener('hashchange', () => {
            this.handleRouteChange();
        });

        // TODOリストのイベント委譲
        this.elements.todoList.addEventListener('click', (e) => {
            const todoItem = e.target.closest('.todo-item');
            if (!todoItem) return;

            const todoId = todoItem.dataset.id;

            if (e.target.classList.contains('todo-item__checkbox')) {
                this.toggleTodo(todoId);
            } else if (e.target.classList.contains('todo-item__edit')) {
                this.startEdit(todoId);
            } else if (e.target.classList.contains('todo-item__delete')) {
                this.deleteTodo(todoId);
            } else if (e.target.classList.contains('todo-item__save')) {
                this.saveEdit(todoId);
            } else if (e.target.classList.contains('todo-item__cancel')) {
                this.cancelEdit();
            }
        });

        // 編集時のキーボードイベント
        this.elements.todoList.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('todo-item__edit-input')) {
                const todoId = e.target.closest('.todo-item').dataset.id;
                
                if (e.key === 'Enter') {
                    this.saveEdit(todoId);
                } else if (e.key === 'Escape') {
                    this.cancelEdit();
                }
            }
        });
    }

    // ルート変更の処理
    handleRouteChange() {
        const hash = window.location.hash;
        let filter = 'all';

        if (hash === '#/active') {
            filter = 'active';
        } else if (hash === '#/completed') {
            filter = 'completed';
        }

        this.setFilter(filter);
    }

    // 新しいTODOを追加
    addTodo() {
        const text = this.elements.todoInput.value.trim();
        
        if (!text) {
            return;
        }

        const newTodo = {
            id: this.generateId(),
            text: text,
            completed: false,
            createdAt: Date.now()
        };

        this.state.todos = [...this.state.todos, newTodo];
        this.elements.todoInput.value = '';
        this.saveToStorage();
        this.render();

        // 新しいアイテムにアニメーションクラスを追加
        setTimeout(() => {
            const newItem = document.querySelector(`[data-id="${newTodo.id}"]`);
            if (newItem) {
                newItem.classList.add('todo-item--new');
            }
        }, 0);
    }

    // TODOの完了状態を切り替え
    toggleTodo(id) {
        this.state.todos = this.state.todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        this.saveToStorage();
        this.render();
    }

    // TODOを削除
    deleteTodo(id) {
        this.state.todos = this.state.todos.filter(todo => todo.id !== id);
        if (this.state.editingId === id) {
            this.state.editingId = null;
        }
        this.saveToStorage();
        this.render();
    }

    // 編集モード開始
    startEdit(id) {
        this.state.editingId = id;
        this.render();
        
        // 編集入力フィールドにフォーカス
        setTimeout(() => {
            const editInput = document.querySelector(`[data-id="${id}"] .todo-item__edit-input`);
            if (editInput) {
                editInput.focus();
                editInput.select();
            }
        }, 0);
    }

    // 編集を保存
    saveEdit(id) {
        const editInput = document.querySelector(`[data-id="${id}"] .todo-item__edit-input`);
        if (!editInput) return;

        const newText = editInput.value.trim();
        if (!newText) {
            this.deleteTodo(id);
            return;
        }

        this.state.todos = this.state.todos.map(todo =>
            todo.id === id ? { ...todo, text: newText } : todo
        );
        
        this.state.editingId = null;
        this.saveToStorage();
        this.render();
    }

    // 編集をキャンセル
    cancelEdit() {
        this.state.editingId = null;
        this.render();
    }

    // フィルターを設定
    setFilter(filter) {
        this.state.currentFilter = filter;
        this.updateFilterUI();
        this.render();
    }

    // フィルターUIを更新
    updateFilterUI() {
        const links = this.elements.filterControls.querySelectorAll('.filter-controls__link');
        links.forEach(link => {
            link.classList.remove('filter-controls__link--active');
            if (link.dataset.filter === this.state.currentFilter) {
                link.classList.add('filter-controls__link--active');
            }
        });
    }

    // 完了済みTODOをすべて削除
    clearCompleted() {
        this.state.todos = this.state.todos.filter(todo => !todo.completed);
        this.saveToStorage();
        this.render();
    }

    // フィルタリングされたTODOリストを取得
    getFilteredTodos() {
        switch (this.state.currentFilter) {
            case 'active':
                return this.state.todos.filter(todo => !todo.completed);
            case 'completed':
                return this.state.todos.filter(todo => todo.completed);
            default:
                return this.state.todos;
        }
    }

    // TODOアイテムのHTML生成
    createTodoItemHTML(todo) {
        const isEditing = this.state.editingId === todo.id;
        
        if (isEditing) {
            return `
                <li class="todo-item ${todo.completed ? 'todo-item--completed' : ''}" data-id="${todo.id}">
                    <div class="todo-item__content">
                        <div class="todo-item__checkbox ${todo.completed ? 'todo-item__checkbox--checked' : ''}"></div>
                        <input type="text" class="todo-item__edit-input" value="${this.escapeHtml(todo.text)}">
                        <div class="todo-item__actions">
                            <button class="todo-item__action todo-item__save" type="button">保存</button>
                            <button class="todo-item__action todo-item__cancel" type="button">キャンセル</button>
                        </div>
                    </div>
                </li>
            `;
        }

        return `
            <li class="todo-item ${todo.completed ? 'todo-item--completed' : ''}" data-id="${todo.id}">
                <div class="todo-item__content">
                    <div class="todo-item__checkbox ${todo.completed ? 'todo-item__checkbox--checked' : ''}"></div>
                    <span class="todo-item__text ${todo.completed ? 'todo-item__text--completed' : ''}">${this.escapeHtml(todo.text)}</span>
                    <div class="todo-item__actions">
                        <button class="todo-item__action todo-item__edit" type="button">編集</button>
                        <button class="todo-item__action todo-item__delete" type="button">削除</button>
                    </div>
                </div>
            </li>
        `;
    }

    // HTMLエスケープ
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // カウンターテキストを更新
    updateCounter() {
        const totalCount = this.state.todos.length;
        const activeCount = this.state.todos.filter(todo => !todo.completed).length;
        const completedCount = totalCount - activeCount;

        let countText = '';
        if (totalCount === 0) {
            countText = 'TODOがありません';
        } else {
            countText = `${totalCount}個のTODO`;
            if (activeCount > 0) {
                countText += ` (${activeCount}個が進行中)`;
            }
        }

        this.elements.todoCount.textContent = countText;

        // 完了済み削除ボタンの表示制御
        if (completedCount > 0) {
            this.elements.clearCompleted.style.display = 'block';
        } else {
            this.elements.clearCompleted.style.display = 'none';
        }
    }

    // アプリケーション全体をレンダリング
    render() {
        const filteredTodos = this.getFilteredTodos();

        // TODOリストをレンダリング
        if (filteredTodos.length === 0) {
            this.elements.todoList.style.display = 'none';
            this.elements.emptyState.style.display = 'block';
            
            // 空の状態のテキストを現在のフィルターに応じて変更
            const emptyText = this.elements.emptyState.querySelector('.todo-list__empty-text');
            switch (this.state.currentFilter) {
                case 'active':
                    emptyText.textContent = '進行中のTODOがありません';
                    break;
                case 'completed':
                    emptyText.textContent = '完了済みのTODOがありません';
                    break;
                default:
                    emptyText.textContent = 'TODOがありません';
            }
        } else {
            this.elements.todoList.style.display = 'block';
            this.elements.emptyState.style.display = 'none';
            
            this.elements.todoList.innerHTML = filteredTodos
                .map(todo => this.createTodoItemHTML(todo))
                .join('');
        }

        // フィルターUIを更新
        this.updateFilterUI();

        // カウンターを更新
        this.updateCounter();
    }
}

// DOM読み込み完了後にアプリケーションを初期化
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});