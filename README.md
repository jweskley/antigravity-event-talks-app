# 📊 BigQuery Release Notes Explorer

Uma aplicação web moderna, responsiva e de alta performance desenvolvida com **Python Flask** no backend e **HTML5, CSS3 e JavaScript puros (Vanilla)** no frontend. O projeto tem como objetivo consumir, processar e exibir de forma inteligente as notas de versão oficiais do BigQuery.

---

## 🎨 Principais Recursos

- **Divisão Granular de Notas:** O backend fatia as notas de versão agrupadas por data em atualizações individuais baseando-se em delimitadores `<h3>`. Isso permite a seleção e o compartilhamento de novidades específicas de forma isolada.
- **Visual Dark Mode & Glassmorphism:** Interface premium inspirada em dashboards modernos utilizando desfoque de fundo (`backdrop-filter`), bordas sutis e gradientes de luz de fundo difusos.
- **Filtros Rápidos e Busca em Tempo Real:** Pesquisa textual instantânea combinada com pílulas de filtros rápidos por tipo de novidade (Features, Alterações, Problemas, Depreciações e Geral).
- **Twitter Share Intent:** Integração nativa que limpa o HTML das notas, resume o texto para respeitar o limite de 280 caracteres do Twitter (já prevendo os 23 caracteres fixos de links encurtados) e gera uma janela de compartilhamento pré-preenchida.
- **Skeleton Screens Pulsantes:** Layout de carregamento dinâmico não-bloqueante que melhora a experiência de usuário durante atualizações assíncronas do feed.
- **Notificações Toast:** Banners elegantes e micro-animados no canto inferior da tela para confirmar ações de cópia de texto ou links.

---

## 📁 Estrutura do Projeto

Os principais arquivos da aplicação estão organizados da seguinte forma:

```text
agy-cli-projects/
├── app.py                 # Servidor Flask e crawler/parser XML
├── templates/
│   └── index.html         # Página única do dashboard HTML5
├── static/
│   ├── style.css          # Estilização CSS e Design System
│   └── app.js             # Lógica e controle de estado do cliente
├── .gitignore             # Arquivos ignorados pelo controle de versão
└── README.md              # Documentação do projeto (este arquivo)
```

- **[app.py](file:///C:/kaggle/Intensive-Agents-IA/Day2/agy-cli-projects/app.py)**: Responsável pelas rotas do servidor e pelo parsing do XML Atom.
- **[templates/index.html](file:///C:/kaggle/Intensive-Agents-IA/Day2/agy-cli-projects/templates/index.html)**: Estrutura HTML5 do painel e dashboard de duas colunas.
- **[static/style.css](file:///C:/kaggle/Intensive-Agents-IA/Day2/agy-cli-projects/static/style.css)**: Estilos, variáveis de cor, transições e media queries responsivas.
- **[static/app.js](file:///C:/kaggle/Intensive-Agents-IA/Day2/agy-cli-projects/static/app.js)**: Lógica de controle JS (Integração API, Filtros, Clipboard e Twitter Intent).
- **[.gitignore](file:///C:/kaggle/Intensive-Agents-IA/Day2/agy-cli-projects/.gitignore)**: Arquivos de cache e ambientes virtuais ignorados.

---

## 🚀 Como Executar

### Pré-requisitos
Certifique-se de ter o **Python 3.x** e o **pip** instalados no seu sistema. O framework **Flask** é a única dependência obrigatória do projeto.

### Instalação e Execução

1. **Abra o terminal** na pasta raiz do projeto.

2. **Instale o Flask** (caso já não o possua instalado globalmente ou em seu ambiente virtual):
   ```bash
   pip install flask
   ```

3. **Inicie o servidor Flask:**
   ```bash
   python app.py
   ```

4. **Acesse a aplicação no navegador:**
   Abra o seu navegador web e acesse: **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🔌 API Endpoint

O backend oferece um único endpoint JSON para consumo de dados estruturados:

- **Rota:** `/api/release-notes`
- **Método:** `GET`
- **Retorno:**
  ```json
  {
    "success": true,
    "count": 68,
    "updates": [
      {
        "id": "June_15__2026_Feature_0",
        "date": "June 15, 2026",
        "type": "Feature",
        "html": "<p>Use Gemini Cloud Assist to analyze your SQL queries...</p>",
        "link": "https://docs.cloud.google.com/bigquery/docs/release-notes#June_15_2026"
      }
    ]
  }
  ```
