<h1>Проект Messenger (название рабочее)</h1>

<h2>Серверная часть</h2>

<h3>Подготовка</h3>
<p>
  1. Установите <a href="https://nodejs.org/">Node.js</a>.<br>
  2. Установите <a href="https://git-scm.com/">Git</a>.<br>
  3. Создайте папку проекта и инициализируйте её:
</p>
<pre>
mkdir messenger-backend
cd messenger-backend
npm init -y
</pre>

<h3>Настройка и запуск</h3>
<p>Установите необходимые пакеты для серверной части:</p>
<pre>
npm install express ws sqlite3 dotenv bcrypt cookie-parser cors sqlite crypto-js
</pre>
<p>
  Затем используйте файл <code>server.js</code> для запуска сервера командой:
</p>
<pre>
node server.js
</pre>

<h2>Клиентская часть</h2>

<h3>Подготовка</h3>
<p>
  1. Перейдите в удобный для вас каталог и создайте проект React:
</p>
<pre>
npx create-react-app messenger-frontend
cd messenger-frontend
npm install websocket crypto-js
</pre>
<p>
  2. Возьмите файлы из моего репозитория <code>messenger-frontend</code> и замените свои в вашем проекте.
</p>

<h3>Редактирование и запуск</h3>
<p>
  Весь код находится (пока что) в файле <code>App.js</code>. Вы можете редактировать его по своему усмотрению или оставить как есть.<br>
  Для тестирования запустите проект командой:
</p>
<pre>
npm start
</pre>

<h3>Сборка проекта</h3>
<p>
  Когда тестирование завершено и вы готовы развернуть проект на сервере, выполните сборку командой:
</p>
<pre>
npm run build
</pre>
<p>
  Не забудьте изменить адрес WebSocket'а на адрес вашего сервера перед сборкой проекта.
</p>

<h3>Подписка</h3>
<p>Проект хоть и медленно с горем пополам, но активно развивается, если интересно, следите за обновлениями.</p>
<p>Подписываемся и гуляем!</p>
