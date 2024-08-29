// Retrieve users from local storage or initialize with an empty object
let users = JSON.parse(localStorage.getItem('users')) || {};
let currentUser = localStorage.getItem('currentUser') || null;

let todoLists = {};
let currentList = '';

// Update UI for logged-in users
function updateUIForLoggedInUser() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('logoutForm').style.display = 'block';
    document.getElementById('listSelector').style.display = 'flex';
    document.getElementById('categorySelector').style.display = 'flex';
    document.getElementById('todoInput').style.display = 'block';
    document.getElementById('dueDateInput').style.display = 'block';
    document.getElementById('dueTimeInput').style.display = 'block';
    document.getElementById('categoryInput').style.display = 'block';
    document.getElementById('addTodoButton').style.display = 'block';
    document.getElementById('welcomeMessage').textContent = `Welcome, ${currentUser}!`;

    todoLists = users[currentUser].todoLists;
    currentList = localStorage.getItem('currentList') || Object.keys(todoLists)[0] || 'Default';
    renderListSelector();
    renderTodos();
}

// Update UI for logged-out users
function updateUIForLoggedOutUser() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('logoutForm').style.display = 'none';
    document.getElementById('listSelector').style.display = 'none';
    document.getElementById('categorySelector').style.display = 'none';
    document.getElementById('todoInput').style.display = 'none';
    document.getElementById('dueDateInput').style.display = 'none';
    document.getElementById('dueTimeInput').style.display = 'none';
    document.getElementById('categoryInput').style.display = 'none';
    document.getElementById('addTodoButton').style.display = 'none';
}

// Login functionality
document.getElementById('loginButton').addEventListener('click', function() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (users[username] && users[username].password === password) {
        currentUser = username;
        localStorage.setItem('currentUser', currentUser);
        updateUIForLoggedInUser();
    } else {
        alert('Invalid username or password');
    }
});

// Registration functionality
document.getElementById('registerButton').addEventListener('click', function() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!users[username]) {
        users[username] = { password: password, todoLists: { 'Default': [] } };
        localStorage.setItem('users', JSON.stringify(users));
        currentUser = username;
        localStorage.setItem('currentUser', currentUser);
        updateUIForLoggedInUser();
    } else {
        alert('Username already exists');
    }
});

// Logout functionality
document.getElementById('logoutButton').addEventListener('click', function() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentList');
    updateUIForLoggedOutUser();
});

// Function to render the list selector dropdown and initialize the selected list
function renderListSelector() {
    const listSelect = document.getElementById('listSelect');
    listSelect.innerHTML = '';
    for (const listName in todoLists) {
        const option = document.createElement('option');
        option.value = listName;
        option.textContent = listName;
        if (listName === currentList) {
            option.selected = true;
        }
        listSelect.appendChild(option);
    }
}

// Function to handle switching between todo lists
document.getElementById('listSelect').addEventListener('change', function() {
    currentList = this.value;
    localStorage.setItem('currentList', currentList);
    renderTodos();
});

// Function to handle category filtering
document.getElementById('categoryFilter').addEventListener('change', function() {
    renderTodos();
});

// Function to create a new todo list
document.getElementById('newListButton').addEventListener('click', function() {
    const newListName = prompt('Enter the name of the new list:');
    if (newListName && !todoLists[newListName]) {
        todoLists[newListName] = [];
        users[currentUser].todoLists = todoLists;
        localStorage.setItem('users', JSON.stringify(users));
        currentList = newListName;
        localStorage.setItem('currentList', currentList);
        renderListSelector();
        renderTodos();
    } else if (todoLists[newListName]) {
        alert('A list with this name already exists.');
    }
});

// Event listener for adding a new todo
document.getElementById('addTodoButton').addEventListener('click', function() {
    const todoText = document.getElementById('todoInput').value;
    const dueDate = document.getElementById('dueDateInput').value;
    const dueTime = document.getElementById('dueTimeInput').value;
    const category = document.getElementById('categoryInput').value;
    if (todoText && dueDate && dueTime && category) {
        const newTodo = { text: todoText, dueDate: `${dueDate}T${dueTime}:00`, category: category };
        todoLists[currentList].push(newTodo);
        users[currentUser].todoLists = todoLists;
        localStorage.setItem('users', JSON.stringify(users));
        renderTodos();
        showPopup(`Todo added: ${todoText}`, `Scheduled for ${new Date(newTodo.dueDate).toLocaleString()}`);
        scheduleNotification(newTodo);
        document.getElementById('todoInput').value = '';
        document.getElementById('dueDateInput').value = '';
        document.getElementById('dueTimeInput').value = '';
        document.getElementById('categoryInput').value = 'Work';
    }
});

// Function to render the list of todos
function renderTodos() {
    const todoList = document.getElementById('todoList');
    todoList.innerHTML = '';
    const selectedCategory = document.getElementById('categoryFilter').value;
    let filteredTodos = todoLists[currentList];

    if (selectedCategory !== 'All') {
        filteredTodos = filteredTodos.filter(todo => todo.category === selectedCategory);
    }

    filteredTodos.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    filteredTodos.forEach((todo, index) => {
        const li = document.createElement('li');

        const input = document.createElement('input');
        input.type = 'text';
        input.value = todo.text;
        input.disabled = true;

        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.value = todo.dueDate.split('T')[0];
        dateInput.disabled = true;

        const timeInput = document.createElement('input');
        timeInput.type = 'time';
        timeInput.value = todo.dueDate.split('T')[1].slice(0, 5);
        timeInput.disabled = true;

        const categoryInput = document.createElement('select');
        ['Work', 'Personal', 'Shopping'].forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            if (category === todo.category) {
                option.selected = true;
            }
            categoryInput.appendChild(option);
        });
        categoryInput.disabled = true;

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => {
            if (input.disabled && dateInput.disabled && timeInput.disabled && categoryInput.disabled) {
                input.disabled = false;
                dateInput.disabled = false;
                timeInput.disabled = false;
                categoryInput.disabled = false;
                editButton.textContent = 'Save';
            } else {
                const updatedTodo = { text: input.value, dueDate: `${dateInput.value}T${timeInput.value}:00`, category: categoryInput.value };
                todoLists[currentList][index] = updatedTodo;
                users[currentUser].todoLists = todoLists;
                localStorage.setItem('users', JSON.stringify(users));
                input.disabled = true;
                dateInput.disabled = true;
                timeInput.disabled = true;
                categoryInput.disabled = true;
                editButton.textContent = 'Edit';
                renderTodos();
                scheduleNotification(updatedTodo);
            }
        });

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete';
        deleteButton.addEventListener('click', () => {
            const confirmDelete = window.confirm(`Are you sure you want to delete the todo: ${todo.text}?`);
            if (confirmDelete) {
                todoLists[currentList].splice(index, 1);
                users[currentUser].todoLists = todoLists;
                localStorage.setItem('users', JSON.stringify(users));
                renderTodos();
                showPopup('Todo deleted', `Todo: ${todo.text} has been deleted.`);
            }
        });

        li.appendChild(input);
        li.appendChild(dateInput);
        li.appendChild(timeInput);
        li.appendChild(categoryInput);
        li.appendChild(editButton);
        li.appendChild(deleteButton);
        todoList.appendChild(li);
    });

    checkForDueTodos(); // Check for due todos whenever the list is rendered
}

// Function to check for due todos and notify the user
function checkForDueTodos() {
    const now = new Date();
    todoLists[currentList].forEach(todo => {
        const dueTime = new Date(todo.dueDate).getTime();
        if (dueTime <= now.getTime()) {
            window.alert(`Todo due: ${todo.text}\nDue on ${new Date(todo.dueDate).toLocaleString()}`);
        }
    });
}

// Function to show a popup using window.confirm
function showPopup(message, description) {
    window.confirm(`${message}\n${description}`);
}

// Function to schedule a notification (using window.alert)
function scheduleNotification(todo) {
    const now = new Date();
    const dueTime = new Date(todo.dueDate).getTime();
    const timeUntilDue = dueTime - now.getTime();

    if (timeUntilDue > 0) {
        setTimeout(() => {
            window.alert(`Todo due: ${todo.text}\nDue now!`);
        }, timeUntilDue);
    }
}

// Initial UI setup based on whether a user is logged in or not
if (currentUser) {
    updateUIForLoggedInUser();
} else {
    updateUIForLoggedOutUser();
}
