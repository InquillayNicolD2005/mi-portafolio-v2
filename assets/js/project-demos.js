(() => {
	const storagePrefix = 'portfolio-project-demo-v1:';
	const weatherSamples = {
		cusco: {
			city: 'Cusco', region: 'Perú · datos de muestra', temperature: 16,
			condition: 'Parcialmente nublado', feelsLike: 15, humidity: 54,
			wind: 11, rain: 15, high: 19, low: 7
		},
		lima: {
			city: 'Lima', region: 'Perú · datos de muestra', temperature: 22,
			condition: 'Cielo despejado', feelsLike: 23, humidity: 71,
			wind: 13, rain: 5, high: 24, low: 18
		},
		arequipa: {
			city: 'Arequipa', region: 'Perú · datos de muestra', temperature: 20,
			condition: 'Soleado', feelsLike: 20, humidity: 38,
			wind: 9, rain: 2, high: 22, low: 9
		}
	};

	function readSaved(key) {
		try {
			const saved = JSON.parse(localStorage.getItem(key) || '[]');
			return Array.isArray(saved) ? saved : [];
		} catch (error) {
			return [];
		}
	}

	function writeSaved(key, items) {
		localStorage.setItem(key, JSON.stringify(items));
	}

	function announce(status, message, state = '') {
		status.textContent = message;
		if (state) status.dataset.state = state;
		else delete status.dataset.state;
	}

	function createDemoShell(title, description, content) {
		return `
			<section class="demo-shell" aria-labelledby="demo-title">
				<header class="demo-heading">
					<h2 id="demo-title">${title}</h2>
					<p>${description}</p>
				</header>
				${content}
			</section>`;
	}

	function mountInventory(host) {
		const key = `${storagePrefix}inventory`;
		let products = readSaved(key).filter((item) => item && typeof item.id === 'string');
		let editingId = null;

		host.innerHTML = createDemoShell(
			'Inventario de productos',
			'Agrega artículos, actualiza sus cantidades y lleva un control sencillo del stock. Los datos se guardan en este dispositivo.',
			`<form class="demo-form" id="inventory-form" novalidate>
				<div class="demo-fields">
					<div class="demo-field">
						<label for="inventory-name">Nombre del producto</label>
						<input id="inventory-name" name="name" type="text" placeholder="Ej. Cuaderno" maxlength="60" required />
					</div>
					<div class="demo-field">
						<label for="inventory-quantity">Cantidad disponible</label>
						<input id="inventory-quantity" name="quantity" type="number" inputmode="numeric" min="1" max="99999" step="1" value="1" required />
					</div>
					<button class="demo-primary" type="submit" id="inventory-submit">Agregar producto</button>
				</div>
				<p class="demo-status" id="inventory-status" role="status" aria-live="polite" aria-atomic="true"></p>
				<p class="inventory-empty" id="inventory-empty">Todavía no hay productos. Agrega el primero arriba.</p>
				<div class="inventory-table-wrap" id="inventory-table-wrap" hidden>
					<table class="demo-table">
						<thead><tr><th scope="col">Producto</th><th scope="col">Stock</th><th scope="col"><span class="visually-hidden">Acciones</span></th></tr></thead>
						<tbody id="inventory-rows"></tbody>
					</table>
				</div>
			</form>`
		);

		const form = host.querySelector('#inventory-form');
		const nameInput = host.querySelector('#inventory-name');
		const quantityInput = host.querySelector('#inventory-quantity');
		const submit = host.querySelector('#inventory-submit');
		const status = host.querySelector('#inventory-status');
		const empty = host.querySelector('#inventory-empty');
		const tableWrap = host.querySelector('#inventory-table-wrap');
		const rows = host.querySelector('#inventory-rows');

		function renderRows() {
			rows.replaceChildren();
			products.forEach((product) => {
				const row = document.createElement('tr');
				const name = document.createElement('td');
				const quantity = document.createElement('td');
				const actions = document.createElement('td');
				const actionGroup = document.createElement('div');
				const editButton = document.createElement('button');
				const deleteButton = document.createElement('button');

				name.textContent = product.name;
				quantity.textContent = String(product.quantity);
				quantity.setAttribute('aria-label', `${product.quantity} unidades`);
				actionGroup.className = 'inventory-actions';
				actions.append(actionGroup);

				editButton.type = 'button';
				editButton.className = 'demo-inline-button';
				editButton.dataset.inventoryAction = 'edit';
				editButton.dataset.productId = product.id;
				editButton.textContent = 'Editar';
				editButton.setAttribute('aria-label', `Editar ${product.name}`);

				deleteButton.type = 'button';
				deleteButton.className = 'demo-inline-button';
				deleteButton.dataset.inventoryAction = 'delete';
				deleteButton.dataset.productId = product.id;
				deleteButton.textContent = 'Eliminar';
				deleteButton.setAttribute('aria-label', `Eliminar ${product.name}`);

				actionGroup.append(editButton, deleteButton);
				row.append(name, quantity, actions);
				rows.append(row);
			});

			const hasProducts = products.length > 0;
			empty.hidden = hasProducts;
			tableWrap.hidden = !hasProducts;
		}

		form.addEventListener('submit', (event) => {
			event.preventDefault();
			if (!form.reportValidity()) return;

			const name = nameInput.value.trim();
			const quantity = Number(quantityInput.value);
			if (!name || !Number.isSafeInteger(quantity) || quantity < 1) {
				announce(status, 'Escribe un nombre y una cantidad entera mayor que cero.', 'error');
				return;
			}

			if (editingId) {
				products = products.map((product) => product.id === editingId ? { ...product, name, quantity } : product);
				editingId = null;
				submit.textContent = 'Agregar producto';
				announce(status, 'Producto actualizado.', 'success');
			} else {
				products.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, quantity });
				announce(status, 'Producto agregado.', 'success');
			}

			try {
				writeSaved(key, products);
			} catch (error) {
				announce(status, 'No se pudo guardar el inventario en este dispositivo.', 'error');
			}
			form.reset();
			quantityInput.value = '1';
			renderRows();
		});

		rows.addEventListener('click', (event) => {
			const button = event.target.closest('button[data-inventory-action]');
			if (!button) return;

			const product = products.find((item) => item.id === button.dataset.productId);
			if (!product) return;

			if (button.dataset.inventoryAction === 'edit') {
				editingId = product.id;
				nameInput.value = product.name;
				quantityInput.value = String(product.quantity);
				submit.textContent = 'Guardar cambios';
				announce(status, `Editando ${product.name}.`);
				nameInput.focus();
				return;
			}

			products = products.filter((item) => item.id !== product.id);
			if (editingId === product.id) {
				editingId = null;
				submit.textContent = 'Agregar producto';
				form.reset();
				quantityInput.value = '1';
			}
			try {
				writeSaved(key, products);
				announce(status, `${product.name} eliminado.`, 'success');
			} catch (error) {
				announce(status, 'No se pudo guardar el cambio.', 'error');
			}
			renderRows();
		});

		renderRows();
	}

	function tokenize(expression) {
		const compact = expression.replace(/\s+/g, '');
		const tokens = compact.match(/(?:\d+(?:\.\d*)?|\.\d+)|[()+\-*/%]/g) || [];
		if (tokens.join('') !== compact) throw new Error('Revisa la expresión: contiene caracteres no válidos.');
		return tokens;
	}

	function evaluateExpression(expression) {
		const tokens = tokenize(expression);
		let cursor = 0;

		function expressionValue() {
			let value = term();
			while (tokens[cursor] === '+' || tokens[cursor] === '-') {
				const operator = tokens[cursor++];
				const next = term();
				value = operator === '+' ? value + next : value - next;
			}
			return value;
		}

		function term() {
			let value = unary();
			while (tokens[cursor] === '*' || tokens[cursor] === '/') {
				const operator = tokens[cursor++];
				const next = unary();
				if (operator === '/' && next === 0) throw new Error('No se puede dividir entre cero.');
				value = operator === '*' ? value * next : value / next;
			}
			return value;
		}

		function unary() {
			if (tokens[cursor] === '+') {
				cursor++;
				return unary();
			}
			if (tokens[cursor] === '-') {
				cursor++;
				return -unary();
			}
			return primary();
		}

		function primary() {
			if (tokens[cursor] === '(') {
				cursor++;
				const value = expressionValue();
				if (tokens[cursor] !== ')') throw new Error('Falta cerrar un paréntesis.');
				cursor++;
				return applyPercent(value);
			}
			const token = tokens[cursor++];
			if (!token || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)) throw new Error('Escribe una expresión matemática válida.');
			return applyPercent(Number(token));
		}

		function applyPercent(value) {
			if (tokens[cursor] === '%') {
				cursor++;
				return value / 100;
			}
			return value;
		}

		if (!tokens.length) throw new Error('Escribe una operación para calcular.');
		const result = expressionValue();
		if (cursor !== tokens.length) throw new Error('Revisa el orden de la operación.');
		if (!Number.isFinite(result)) throw new Error('El resultado está fuera del rango admitido.');
		return Number(result.toPrecision(12));
	}

	function mountCalculator(host) {
		host.innerHTML = createDemoShell(
			'Calculadora',
			'Realiza operaciones básicas, porcentajes y expresiones con paréntesis.',
			`<div class="calculator-display">
				<label class="visually-hidden" for="calculator-expression">Operación</label>
				<input id="calculator-expression" type="text" inputmode="decimal" autocomplete="off" placeholder="Ej. (24 + 6) × 3" aria-describedby="calculator-result" />
				<output class="calculator-result" id="calculator-result" aria-live="polite">Escribe una operación</output>
			</div>
			<div class="calculator-keys" aria-label="Teclado de la calculadora">
				<button class="demo-key" type="button" data-calc="clear" aria-label="Borrar todo">AC</button>
				<button class="demo-key" type="button" data-calc="append" data-value="(">(</button>
				<button class="demo-key" type="button" data-calc="append" data-value=")">)</button>
				<button class="demo-key demo-key--accent" type="button" data-calc="append" data-value="/" aria-label="Dividir">÷</button>
				<button class="demo-key" type="button" data-calc="append" data-value="7">7</button>
				<button class="demo-key" type="button" data-calc="append" data-value="8">8</button>
				<button class="demo-key" type="button" data-calc="append" data-value="9">9</button>
				<button class="demo-key demo-key--accent" type="button" data-calc="append" data-value="*" aria-label="Multiplicar">×</button>
				<button class="demo-key" type="button" data-calc="append" data-value="4">4</button>
				<button class="demo-key" type="button" data-calc="append" data-value="5">5</button>
				<button class="demo-key" type="button" data-calc="append" data-value="6">6</button>
				<button class="demo-key demo-key--accent" type="button" data-calc="append" data-value="-" aria-label="Restar">−</button>
				<button class="demo-key" type="button" data-calc="append" data-value="1">1</button>
				<button class="demo-key" type="button" data-calc="append" data-value="2">2</button>
				<button class="demo-key" type="button" data-calc="append" data-value="3">3</button>
				<button class="demo-key demo-key--accent" type="button" data-calc="append" data-value="+" aria-label="Sumar">+</button>
				<button class="demo-key" type="button" data-calc="append" data-value="0">0</button>
				<button class="demo-key" type="button" data-calc="append" data-value=".">.</button>
				<button class="demo-key" type="button" data-calc="append" data-value="%">%</button>
				<button class="demo-key demo-key--accent" type="button" data-calc="equals" aria-label="Calcular">=</button>
			</div>`
		);

		const expression = host.querySelector('#calculator-expression');
		const result = host.querySelector('#calculator-result');
		const keys = host.querySelector('.calculator-keys');

		function calculate() {
			try {
				const value = evaluateExpression(expression.value);
				result.value = String(value);
				result.textContent = `Resultado: ${value}`;
				result.dataset.state = 'success';
			} catch (error) {
				result.value = '';
				result.textContent = error.message;
				result.dataset.state = 'error';
			}
		}

		keys.addEventListener('click', (event) => {
			const button = event.target.closest('button[data-calc]');
			if (!button) return;

			if (button.dataset.calc === 'clear') {
				expression.value = '';
				result.textContent = 'Escribe una operación';
				delete result.dataset.state;
			} else if (button.dataset.calc === 'equals') {
				calculate();
			} else {
				expression.value += button.dataset.value;
				expression.focus();
			}
		});

		expression.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				calculate();
			}
		});
	}

	function mountWeather(host) {
		host.innerHTML = createDemoShell(
			'Clima de hoy',
			'Consulta una demostración local del clima. Cambia la ciudad para comparar condiciones.',
			`<div class="demo-field weather-city-picker">
				<label for="weather-city">Ciudad</label>
				<select id="weather-city">
					<option value="cusco">Cusco</option>
					<option value="lima">Lima</option>
					<option value="arequipa">Arequipa</option>
				</select>
			</div>
			<section class="weather-overview" aria-labelledby="weather-city-name">
				<div>
					<p class="weather-location" id="weather-region"></p>
					<h3 class="weather-city" id="weather-city-name"></h3>
					<p class="weather-condition" id="weather-condition"></p>
					<p class="weather-condition" id="weather-range"></p>
				</div>
				<p class="weather-temperature"><span id="weather-temperature"></span><span class="weather-unit">°</span><span class="visually-hidden"> Celsius</span></p>
			</section>
			<dl class="weather-metrics">
				<div class="weather-metric"><dt>Sensación térmica</dt><dd id="weather-feels"></dd></div>
				<div class="weather-metric"><dt>Humedad</dt><dd id="weather-humidity"></dd></div>
				<div class="weather-metric"><dt>Viento</dt><dd id="weather-wind"></dd></div>
				<div class="weather-metric"><dt>Prob. de lluvia</dt><dd id="weather-rain"></dd></div>
			</dl>
			<p class="weather-note" role="note">Datos de demostración — no representan una medición en tiempo real.</p>`
		);

		const select = host.querySelector('#weather-city');
		function renderWeather() {
			const sample = weatherSamples[select.value] || weatherSamples.cusco;
			host.querySelector('#weather-city-name').textContent = sample.city;
			host.querySelector('#weather-region').textContent = sample.region;
			host.querySelector('#weather-condition').textContent = sample.condition;
			host.querySelector('#weather-range').textContent = `Máx. ${sample.high}° · Mín. ${sample.low}°`;
			host.querySelector('#weather-temperature').textContent = String(sample.temperature);
			host.querySelector('#weather-feels').textContent = `${sample.feelsLike} °C`;
			host.querySelector('#weather-humidity').textContent = `${sample.humidity}%`;
			host.querySelector('#weather-wind').textContent = `${sample.wind} km/h`;
			host.querySelector('#weather-rain').textContent = `${sample.rain}%`;
		}

		select.addEventListener('change', renderWeather);
		renderWeather();
	}

	function secureRandomInteger(max) {
		if (!window.crypto || !window.crypto.getRandomValues) throw new Error('Este navegador no dispone de un generador seguro.');
		const range = 256;
		const ceiling = Math.floor(range / max) * max;
		const buffer = new Uint8Array(1);
		do {
			window.crypto.getRandomValues(buffer);
		} while (buffer[0] >= ceiling);
		return buffer[0] % max;
	}

	function mountPassword(host) {
		host.innerHTML = createDemoShell(
			'Generador de contraseñas',
			'Elige la longitud y los caracteres que quieres incluir. La contraseña se genera en tu navegador y no se guarda.',
			`<div class="password-controls">
				<div class="demo-field">
					<label for="password-length">Longitud</label>
					<input id="password-length" type="number" min="8" max="64" step="1" value="16" inputmode="numeric" />
				</div>
				<fieldset class="password-options" aria-label="Caracteres incluidos">
					<label class="password-option"><input type="checkbox" name="password-lowercase" checked /> Minúsculas</label>
					<label class="password-option"><input type="checkbox" name="password-uppercase" checked /> Mayúsculas</label>
					<label class="password-option"><input type="checkbox" name="password-numbers" checked /> Números</label>
					<label class="password-option"><input type="checkbox" name="password-symbols" checked /> Símbolos</label>
				</fieldset>
			</div>
			<div class="password-result-row">
				<div class="demo-field">
					<label for="password-result">Tu contraseña</label>
					<input id="password-result" type="text" readonly spellcheck="false" autocomplete="off" placeholder="Genera una contraseña segura" />
				</div>
				<button class="demo-button demo-button--quiet" id="password-copy" type="button" disabled>Copiar</button>
			</div>
			<div class="password-actions">
				<button class="demo-button" id="password-generate" type="button">Generar contraseña</button>
			</div>
			<p class="demo-status" id="password-status" role="status" aria-live="polite" aria-atomic="true"></p>`
		);

		const lengthInput = host.querySelector('#password-length');
		const output = host.querySelector('#password-result');
		const status = host.querySelector('#password-status');
		const copyButton = host.querySelector('#password-copy');
		const characterGroups = [
			{ selector: '[name="password-lowercase"]', chars: 'abcdefghijklmnopqrstuvwxyz' },
			{ selector: '[name="password-uppercase"]', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
			{ selector: '[name="password-numbers"]', chars: '0123456789' },
			{ selector: '[name="password-symbols"]', chars: '!@#$%^&*()-_=+[]{}?' }
		];

		function generatePassword() {
			const length = Number(lengthInput.value);
			const chosen = characterGroups.filter(({ selector }) => host.querySelector(selector).checked);
			if (!Number.isSafeInteger(length) || length < 8 || length > 64) {
				announce(status, 'Elige una longitud entre 8 y 64 caracteres.', 'error');
				lengthInput.focus();
				return;
			}
			if (!chosen.length) {
				announce(status, 'Selecciona al menos un tipo de carácter.', 'error');
				return;
			}

			try {
				const allChars = chosen.map(({ chars }) => chars).join('');
				const passwordChars = chosen.map(({ chars }) => chars[secureRandomInteger(chars.length)]);
				while (passwordChars.length < length) passwordChars.push(allChars[secureRandomInteger(allChars.length)]);
				for (let index = passwordChars.length - 1; index > 0; index--) {
					const swapIndex = secureRandomInteger(index + 1);
					[passwordChars[index], passwordChars[swapIndex]] = [passwordChars[swapIndex], passwordChars[index]];
				}
				output.value = passwordChars.join('');
				copyButton.disabled = false;
				announce(status, 'Contraseña generada con éxito.', 'success');
			} catch (error) {
				announce(status, error.message || 'No se pudo generar una contraseña.', 'error');
			}
		}

		async function copyPassword() {
			if (!output.value) return;
			try {
				if (navigator.clipboard && window.isSecureContext) {
					await navigator.clipboard.writeText(output.value);
				} else {
					output.focus();
					output.select();
					if (!document.execCommand('copy')) throw new Error('No se pudo acceder al portapapeles.');
				}
				announce(status, 'Contraseña copiada al portapapeles.', 'success');
			} catch (error) {
				announce(status, 'No se pudo copiar. Selecciona la contraseña para copiarla manualmente.', 'error');
			}
		}

		host.querySelector('#password-generate').addEventListener('click', generatePassword);
		copyButton.addEventListener('click', copyPassword);
	}

	const demos = {
		inventario: mountInventory,
		calculadora: mountCalculator,
		clima: mountWeather,
		contrasenas: mountPassword
	};

	window.ProjectDemos = {
		mount(project) {
			const host = document.getElementById('project-demo');
			const mountDemo = demos[project];
			if (!host || !mountDemo) return;
			host.hidden = false;
			mountDemo(host);
		}
	};
})();
