# Tema Alpha — Shopify

Tema Shopify 2.0 custom (não baseado no Dawn) para a marca Alpha. Este documento explica, conceito por conceito, como as boas práticas que a própria Shopify recomenda pra construção de temas foram aplicadas neste código — não é um changelog, é um guia de "o que é a regra" + "onde e como ela está implementada aqui".

## Configurações do tema via `settings_schema.json`

**Recomendação da Shopify:** todo tema Online Store 2.0 deve expor suas opções visuais (cores, tipografia, layout) num painel de "Configurações do tema", pra que o lojista consiga customizar sem editar código.

**Como está aplicado:** `config/settings_schema.json` define os grupos Cores, Tipografia, Layout, Cashback & Frete e Favicon. Os `id` de cada setting (`color_accent`, `font_body`, `page_width`, etc.) batem propositalmente com os valores que já existiam em `config/settings_data.json`, e são consumidos em `layout/theme.liquid` sobrescrevendo as CSS custom properties que antes estavam fixas em `assets/base.css`:

```liquid
<style>
  :root {
    --green: {{ settings.color_accent | default: '#5f9e2e' }};
    --font-body: {{ settings.font_body | default: "'Archivo', system-ui, sans-serif" }};
    --maxw: {{ settings.page_width | default: 1300 }}px;
  }
</style>
```

Mudar a cor no Editor agora reflete no storefront sem precisar tocar em `base.css`.

## Sections everywhere + blocks

**Recomendação da Shopify:** a arquitetura Online Store 2.0 trata todo template como uma lista de seções (`{% section %}`), e cada seção pode ter `blocks` reordenáveis/adicionáveis pelo merchant — isso é o que dá flexibilidade de merchandising sem depender de dev pra cada mudança de página.

**Como está aplicado:** além das seções fixas que o tema já tinha (`hero-banner`, `featured-products`...), foram adicionadas três seções genéricas de conteúdo — `sections/rich-text.liquid`, `sections/newsletter.liquid` e `sections/faq.liquid` (esta com `blocks` do tipo `question`, `max_blocks: 20`) — pra permitir montar páginas institucionais (sobre a marca, políticas, dúvidas frequentes) direto no Editor, sem código novo a cada landing page.

## SEO técnico — dados estruturados (JSON-LD)

**Recomendação da Shopify:** marcar páginas de produto, navegação e conteúdo com Schema.org (`application/ld+json`) pra habilitar rich snippets no Google — preço, disponibilidade, nota de avaliação, breadcrumb, sitelinks search box.

**Como está aplicado:**

| Schema | Arquivo |
| --- | --- |
| `Product` (com `offers`, `brand`, `aggregateRating` condicional) | `sections/main-product.liquid` |
| `BreadcrumbList` (espelha a trilha visual já renderizada) | `snippets/breadcrumb.liquid` |
| `Organization` + `WebSite`/`SearchAction` | `layout/theme.liquid` |
| `FAQPage` | `sections/faq.liquid` |

O `BreadcrumbList`, por exemplo, é gerado a partir da mesma lógica condicional (`template.name == 'product'`, `'collection'`, etc.) que já monta o breadcrumb visual — o JSON-LD nunca diverge do que é mostrado na tela porque usa as mesmas variáveis Liquid.

## SEO para LLMs / Answer Engine Optimization (AEO)

Buscadores de IA (ChatGPT, Perplexity, Claude, Gemini) cada vez mais respondem direto em vez de listar links, citando só 2–3 fontes por resposta. Isso muda o alvo: não basta rankear, o conteúdo precisa ser fácil de um LLM extrair e citar com segurança. O que a Shopify recomenda/oferece nativamente pra isso:

**1. Dados estruturados são a base, e já estão feitos.** LLMs e crawlers de IA leem o mesmo `application/ld+json` que o Google usa pra rich snippets — não é um trabalho novo, é o que já foi implementado na seção anterior (`Product`, `BreadcrumbList`, `Organization`, `FAQPage`). Um site com schema completo dá ao modelo entidades prontas (preço, disponibilidade, marca, avaliação) em vez de forçá-lo a interpretar texto solto.

**2. Consistência entre schema e o que aparece na tela.** Motores de busca tradicionais toleram pequenas divergências (ex: schema diz R$ 29, página mostra R$ 35); agentes de IA são bem mais rígidos com isso e tendem a descartar a fonte quando os dados não batem. Por isso o JSON-LD de produto neste tema (`sections/main-product.liquid`) usa exatamente `product.selected_or_first_available_variant.price`/`.available` — os mesmos valores renderizados na tela, nunca um número calculado à parte.

**3. Filtro nativo `structured_data`.** A Shopify tem um filtro Liquid pronto — `{{ product | structured_data }}` / `{{ article | structured_data }}` — que gera o JSON-LD automaticamente (`Product`/`ProductGroup` conforme o produto tem variantes ou não; `Article` pra posts de blog; inclui `brand` a partir de `product.vendor`). É a via mais simples recomendada pela Shopify. Este tema optou por escrever o JSON-LD manualmente em vez de usar o filtro por um motivo específico e confirmado: o filtro **não gera `aggregateRating`** — a própria Shopify já reconheceu isso (pedido de feature em aberto desde set/2025) e recomenda oficialmente como alternativa "adicionar manualmente um snippet JSON-LD usando `reviews.rating` e `reviews.rating_count`". É exatamente o que este tema já fazia via metafield (`product.metafields.reviews.rating`/`rating_count`), então manter o JSON-LD manual — em vez de trocar pro filtro e perder a nota de avaliação — foi a escolha certa aqui.

**4. `agents.md` / `llms.txt` (nativo desde 29/05/2026).** A Shopify passou a servir `/agents.md` automaticamente em qualquer loja, com `/llms.txt` e `/llms-full.txt` espelhando o mesmo conteúdo por padrão. Este tema já customiza os três — detalhes completos na próxima seção.

**5. Conteúdo em formato pergunta-resposta.** A seção `sections/faq.liquid` (com `FAQPage` schema) já segue esse padrão — blocos de resposta de IA preferem citar conteúdo que já está estruturado como pergunta direta + resposta objetiva, em vez de parágrafos longos de texto corrido.

## Descoberta por agentes de IA — `agents.md`, `llms.txt`, `llms-full.txt`

Desde 29/05/2026 a Shopify serve automaticamente um `/agents.md` em qualquer loja — um documento pensado pra agentes de IA (assistentes de compra, crawlers de LLM) descobrirem e interagirem com a loja, incluindo suporte ao **UCP (Universal Commerce Protocol)**, o protocolo da Shopify pra comércio orientado por agentes. `/llms.txt` e `/llms-full.txt` são URLs alternativas que, por padrão, espelham o mesmo conteúdo do `/agents.md`.

### As três URLs e o template que cada uma usa

| URL pública | Template que controla | Sem template custom |
| --- | --- | --- |
| `/agents.md` | `templates/agents.md.liquid` | Versão gerada automaticamente pela Shopify |
| `/llms.txt` | `templates/llms.txt.liquid` | Cai pro `agents.md.liquid`; se também não existir, versão automática |
| `/llms-full.txt` | `templates/llms-full.txt.liquid` | Mesma cadeia de fallback do `/llms.txt` |

Ordem de prioridade pra cada URL: **1)** o template específico daquela URL, se existir → **2)** `agents.md.liquid` (serve de fallback pras outras duas) → **3)** a versão que a Shopify gera sozinha. Ou seja, `agents.md.liquid` é a "superfície de autoria canônica": dá pra manter só ele e as outras duas URLs herdam o conteúdo automaticamente — só vale criar `llms.txt.liquid`/`llms-full.txt.liquid` dedicados quando o conteúdo *precisa* divergir do `agents.md` (como este tema faz: `llms.txt` recebe uma versão resumida, `llms-full.txt` recebe a versão completa).

### Contexto Liquid restrito

Esses três templates rodam num contexto isolado — só os objetos **`request`** e **`agents`** existem. `shop`, `collections`, `linklists`, `product` etc. **não são injetados** (ficam em branco se referenciados), então o conteúdo é sempre uma mistura de texto estático escrito à mão + os campos dinâmicos abaixo.

### Propriedades do objeto `agents`

| Propriedade | Tipo | O que é |
| --- | --- | --- |
| `agents.store_name` | string | Nome da loja |
| `agents.store_url` | string | URL completa (domínio primário) |
| `agents.ucp_discovery_url` | string | Endpoint de discovery do UCP |
| `agents.mcp_endpoint_url` | string | Endpoint MCP (Model Context Protocol) |
| `agents.ucp_versions` | array | Versões do UCP suportadas (mais recente primeiro) |
| `agents.currency` | string | Moeda principal da loja (ex: `BRL`) |
| `agents.sitemap_url` | string | URL do sitemap |

### Como está aplicado neste tema

- **`templates/agents.md.liquid`** — versão canônica e mais completa: descreve a marca, o protocolo UCP (discovery + endpoint MCP + `{% for version in agents.ucp_versions %}`), os endpoints de navegação somente leitura (`/collections/all`, `/products/{handle}.json`) e onde ficam as políticas da loja.
- **`templates/llms.txt.liquid`** — resumo curto que aponta pro `agents.md` como fonte completa, seguindo a convenção original do formato `llms.txt` (arquivo enxuto, não a versão inteira).
- **`templates/llms-full.txt.liquid`** — mesmo nível de detalhe do `agents.md`, servido no path alternativo.

Trecho de `templates/agents.md.liquid`:

```liquid
# Agent Instructions — {{ agents.store_name }}

## Commerce Protocol (UCP)

- Discovery: `GET {{ agents.ucp_discovery_url }}`
- Endpoint MCP: `POST {{ agents.mcp_endpoint_url }}`

### Versões UCP suportadas
{% for version in agents.ucp_versions %}
- {{ version }}{% if forloop.first %} (mais recente){% endif %}
{% endfor %}
```

### Cuidados

- Não pode ser template JSON — o arquivo precisa terminar em `.liquid` mesmo servindo texto/Markdown puro (`agents.md.liquid`, não `agents.md.json`).
- **Não coloque dado privado do lojista** (telefone, e-mail de contato pessoal) nesses arquivos — eles são públicos e ficam em cache.
- `/llms.txt` e `/llms-full.txt` são servidos no domínio primário "nu", sem prefixo de idioma ou de mercado (Shopify Markets).
- O `theme check` instalado ainda não reconhece o objeto `agents` (é recurso muito novo) e acusa `UndefinedObject` nesses três arquivos — falso positivo, mesma categoria do aviso já existente com `paginate` em `main-collection.liquid`.

### Documentação oficial

- [`agents.md.liquid`](https://shopify.dev/docs/storefronts/themes/architecture/templates/agents-md-liquid)
- [`llms.txt.liquid`](https://shopify.dev/docs/storefronts/themes/architecture/templates/llms-txt-liquid)
- [`llms-full.txt.liquid`](https://shopify.dev/docs/storefronts/themes/architecture/templates/llms-full-txt-liquid)
- [Changelog — Customize /llms.txt, /llms-full.txt and /agents.md](https://shopify.dev/changelog/customize-llmstxt-llms-fulltxt-and-agentsmd)

## Performance — servir assets pelo CDN da Shopify, não por origem externa

**Recomendação da Shopify:** o próprio `theme-check` tem uma regra (`RemoteAsset`) que reprova assets carregados de domínios de terceiros — cada origem externa custa uma resolução DNS + handshake TCP/TLS antes do primeiro byte, o que atrasa diretamente o First Contentful Paint.

**Como está aplicado:** o tema carregava Archivo, Saira e Saira Condensed via `fonts.googleapis.com` / `fonts.gstatic.com`. Os arquivos `.woff2` reais servidos pelo Google foram baixados (Archivo e Saira são fontes variáveis — um único arquivo cobre todos os pesos pedidos; Saira Condensed usa 5 arquivos estáticos, um por peso) e passaram a ser servidos como assets do próprio tema, referenciados via `asset_url` dentro de `@font-face` em `layout/theme.liquid`:

```liquid
src: url({{ 'archivo-variable.woff2' | asset_url }}) format('woff2');
```

Os dois `<link rel="preconnect">` pro Google foram removidos porque não existe mais nenhuma requisição pra esse domínio.

## Performance — carregamento de imagem e Cumulative Layout Shift

**Recomendação da Shopify:** só a imagem candidata a Largest Contentful Paint deve carregar com `loading="eager"` (e idealmente `fetchpriority="high"`); todo o resto deve ser `loading="lazy"`. Toda `<img>` deve ter `width`/`height` (ou usar `image_tag`, que já infere os dois a partir da imagem original) pra reservar espaço no layout e não gerar CLS.

**Como está aplicado:** o padrão já existia de forma consistente no tema (conferido em todas as seções) — `snippets/responsive-image.liquid` recebe `loading` como parâmetro, e quem chama decide: `hero-banner.liquid` usa `eager` + `fetchpriority: 'high'` só no primeiro slide, `main-product.liquid` usa `eager` na imagem principal da PDP e `lazy` nas thumbnails, o resto do tema (cards, carrinho, colunas de coleção) usa `lazy`. Foi corrigido um caso fora desse padrão: o `<img>` do lightbox em `sections/main-product.liquid` tinha `src=""` vazio — o que faz vários navegadores reinterpretarem a própria URL da página como origem da imagem e disparar uma requisição desnecessária — e não tinha `width`/`height`. Trocado por:

```liquid
<img id="pdpLbImg" alt="{{ product.title }}" width="1200" height="1200" loading="lazy">
```

(sem `src`, já que o JS só popula ao abrir o lightbox).

## Liquid — `render` em vez de `include`, e reuso via snippets

**Recomendação da Shopify:** `{% include %}` é deprecado; `{% render %}` cria um escopo isolado (não enxerga nem vaza variáveis do template que chamou), o que é mais previsível e também mais rápido de processar. Lógica repetida em mais de um lugar deve virar snippet.

**Como está aplicado:** todo o tema já usava `render`. As bandeiras de pagamento (Pix, Visa, Mastercard, Elo, Amex, Hipercard, Boleto) apareciam duplicadas como texto em `sections/footer.liquid` e `sections/main-cart.liquid` — foram extraídas pra `snippets/payment-badges.liquid` (ícones SVG com a cor de cada marca) e agora as duas seções só fazem `{% render 'payment-badges' %}`.

## Acessibilidade

**Recomendação da Shopify:** todo tema deve ter um skip-link no topo do `<body>` pra permitir que navegação por teclado/leitor de tela pule direto pro conteúdo principal, sem precisar tabular por header/menu inteiro em cada página.

**Como está aplicado:** `layout/theme.liquid` agora abre o `<body>` com:

```liquid
<a class="skip-link" href="#MainContent">{{ 'accessibility.skip_to_content' | t }}</a>
```

apontando pro `id="MainContent"` que já existia no `<main>`. A chave de tradução já estava definida em `locales/pt-BR.default.json`, só nunca tinha sido usada em lugar nenhum.

## Localização via locale files

**Recomendação da Shopify:** texto de interface (não conteúdo editorial) deve viver em `locales/*.json` e ser puxado com o filtro `t`, em vez de hardcoded no Liquid — isso é o que permite o tema suportar mais de um idioma sem duplicar templates.

**Como está aplicado:** a seção `newsletter` usa `{{ 'newsletter.email_placeholder' | t }}`, `{{ 'newsletter.submit' | t }}`, etc., com as chaves correspondentes adicionadas em `locales/pt-BR.default.json`.

## `shopify theme check` como validação contínua

**Recomendação da Shopify:** rodar o Theme Check (linter oficial) antes de publicar — ele pega erros de schema JSON, tags Liquid deprecadas, objetos desconhecidos, problemas de acessibilidade/performance (`ImgWidthAndHeight`, `RemoteAsset`, `ParserBlockingScript`) antes de irem pra produção.

**Como está aplicado:** cada mudança deste tema foi validada com `shopify theme check` — é a ferramenta que originalmente apontou o `RemoteAsset` das fontes do Google e o `ImgWidthAndHeight` do lightbox, guiando exatamente quais correções de performance fazer.

## Como validar

```bash
shopify theme check      # lint oficial da Shopify
shopify theme dev        # sobe o tema localmente pra testar no navegador
```

No Theme Editor, confira: painel "Configurações do tema" refletindo mudanças de cor ao vivo, seções Rich text/Newsletter/FAQ disponíveis pra adicionar, e o rodapé/carrinho mostrando as bandeiras de pagamento coloridas.
