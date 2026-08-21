# RouteFlow

Sistema de otimização de rotas com múltiplos endereços. Informe uma origem e
vários destinos: o RouteFlow calcula a melhor sequência de visita, desenha o
trajeto no mapa e estima distância e tempo para diferentes modos de transporte.

Construído inteiramente sobre serviços abertos e gratuitos — **OpenStreetMap**,
**Nominatim** e **OSRM**. Nenhuma chave de API obrigatória, nenhum cartão de
crédito, sem dependência do Google Maps.

---

## Funcionalidades

- **Origem flexível** — digite o endereço ou use a geolocalização do navegador.
- **Destinos ilimitados** — adicione, remova e reordene quantos quiser.
- **Autocomplete de endereços** com debounce, cache local e cancelamento de
  requisições obsoletas.
- **Otimização de sequência** com algoritmo próprio: força bruta exata para
  poucos destinos, vizinho mais próximo + 2-opt + Or-opt para volumes maiores.
  Os custos vêm da **matriz real do motor de rotas**, nunca de distância em
  linha reta.
- **Três critérios de otimização**: menor tempo (padrão), menor distância e
  equilibrada.
- **Comparação de modos**: 🚶 a pé, 🏍️ moto e 🚗 carro, com distância e tempo.
- **Mapa interativo** (Leaflet + OpenStreetMap) com marcadores numerados na
  ordem otimizada, origem destacada, traçado da rota e enquadramento
  automático.
- **Lista de paradas** com distância e tempo por trecho e reordenação por
  arrastar-e-soltar, seguida de **revalidação** do percurso.
- **Dashboard** com destinos, tempo estimado, distância e ganho de eficiência
  sobre a ordem digitada.
- **Compartilhamento por link** e **exportação** em CSV, JSON e impressão/PDF.
- **Modo de demonstração** com cinco endereços reais de São Paulo.
- **Persistência local** de endereços, coordenadas e última rota calculada.
- **Responsivo** de verdade: no celular o painel fica acima do mapa, com
  botões em área de toque confortável.

### Sobre a estimativa de motocicleta

O OSRM não possui perfil de motocicleta. Em vez de inventar números, o
RouteFlow usa o perfil de veículo e **informa explicitamente na interface**:
*"Estimativa baseada em rota de veículo."* Nenhum valor aproximado é
apresentado como dado real de navegação de moto.

---

## Tecnologias

| Camada          | Tecnologia                                        |
| --------------- | ------------------------------------------------- |
| Framework       | Next.js 16 (App Router) + React 19                |
| Linguagem       | TypeScript (modo estrito)                         |
| Estilo          | Tailwind CSS v4 + componentes no padrão shadcn/ui |
| Mapa            | Leaflet + React Leaflet + tiles do OpenStreetMap  |
| Geocodificação  | Nominatim                                         |
| Roteamento      | OSRM (instâncias públicas da FOSSGIS)             |
| Otimização      | Algoritmo próprio (força bruta / NN + 2-opt + Or-opt) |
| Drag-and-drop   | dnd-kit                                           |
| Ícones          | lucide-react                                      |

Persistência usa `localStorage` — não há banco de dados. PostgreSQL/Supabase
só seriam necessários para recursos de conta e histórico compartilhado, que
não fazem parte desta versão.

---

## Estrutura do projeto

```
routeflow/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── geocode/route.ts            # busca de endereços (Nominatim)
│   │   │   ├── geocode/reverse/route.ts    # geocodificação reversa
│   │   │   ├── routing/matrix/route.ts     # matriz de custos (OSRM /table)
│   │   │   └── routing/directions/route.ts # traçado por modo (OSRM /route)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css                     # tokens do sistema visual
│   ├── components/
│   │   ├── map/                            # RouteMap, MapView, marcadores
│   │   ├── panel/                          # origem, destinos, autocomplete
│   │   ├── results/                        # melhor rota, comparação, paradas
│   │   ├── ui/                             # primitivos (button, card, ...)
│   │   ├── AppHeader.tsx
│   │   └── RoutePlannerScreen.tsx          # composição da tela
│   ├── hooks/
│   │   ├── useRoutePlanner.ts              # estado central do planejador
│   │   ├── useAddressSearch.ts             # autocomplete com debounce
│   │   └── useDebouncedValue.ts
│   ├── lib/
│   │   ├── cache.ts                        # cache TTL + dedupe de chamadas
│   │   ├── config.ts                       # configuração dos provedores
│   │   ├── constants.ts                    # modos de transporte/otimização
│   │   ├── demoData.ts
│   │   ├── http.ts                         # fetch com timeout e retry
│   │   ├── rateLimit.ts                    # fila que respeita o Nominatim
│   │   ├── session.ts                      # persistência em localStorage
│   │   └── validation.ts
│   ├── services/
│   │   ├── geocoding/                      # GeocodingProvider + Nominatim
│   │   ├── routing/                        # RoutingProvider + OSRM
│   │   ├── optimization/                   # OptimizationProvider + algoritmos
│   │   ├── location/                       # geolocalização do navegador
│   │   └── routePlanner.ts                 # orquestração do cálculo
│   ├── types/index.ts                      # tipos de domínio
│   └── utils/                              # formatação, geo, export, share
├── .env.example
└── package.json
```

### Arquitetura e troca de provedores

O restante da aplicação nunca conhece Nominatim nem OSRM. Três interfaces
isolam os serviços externos:

```ts
interface GeocodingProvider {
  searchAddress(query: string, options?): Promise<Location[]>;
  reverse(coordinate: Coordinate, options?): Promise<Location | null>;
}

interface RoutingProvider {
  calculateRoute(points: Coordinate[], mode: TransportMode, options?): Promise<Route>;
  calculateMatrix(points: Coordinate[], mode: TransportMode, options?): Promise<CostMatrix>;
}

interface OptimizationProvider {
  optimizeRoute(matrix: CostMatrix, options: OptimizationOptions): Promise<OptimizationResult>;
}
```

Para trocar de fornecedor:

- **Nominatim → outro geocoder**: escreva uma classe que implemente
  `GeocodingProvider` e aponte `src/app/api/geocode/route.ts` para ela.
- **OSRM → GraphHopper/Valhalla**: implemente `RoutingProvider` e troque a
  instância em `src/app/api/routing/*`.
- **Leaflet → outro mapa**: substitua `src/components/map/RouteMap.tsx`; ele é
  o único arquivo que importa Leaflet.

As chamadas aos serviços externos acontecem **no servidor** (rotas `/api`).
Isso permite enviar o `User-Agent` exigido pelo Nominatim, respeitar o limite
de 1 requisição por segundo e manter os endpoints fora do bundle do navegador.

### Preparado para restrições futuras

O tipo `StopConstraints` já existe em cada parada, com campos para janela de
atendimento, prioridade, precedência, tempo de permanência e parada fixa. O
otimizador recebe essas restrições via `OptimizationOptions.constraints`. A v1
não as aplica, mas nenhum remodelamento de estado será necessário para
suportar janelas de horário, pausas, limite de distância ou múltiplos
veículos/entregadores.

---

## Executando localmente

Pré-requisitos: **Node.js 20+** e npm.

```bash
cd routeflow
npm install
npm run dev
```

Acesse <http://localhost:3000>.

Verificações antes de publicar:

```bash
npm run lint       # ESLint (flat config)
npm run typecheck  # TypeScript sem emitir
npm run build      # build de produção
npm start          # servir o build
```

---

## Variáveis de ambiente

**Todas são opcionais.** Sem nenhuma delas o projeto usa os serviços públicos
gratuitos. Copie `.env.example` para `.env.local` e ajuste o que precisar:

```bash
cp .env.example .env.local
```

| Variável                 | Padrão                                       | Para que serve                                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------------------------- |
| `NOMINATIM_APP_NAME`     | `RouteFlow`                                  | Nome enviado no `User-Agent` ao Nominatim.                        |
| `NOMINATIM_CONTACT_EMAIL`| *(vazio)*                                    | Contato no `User-Agent`. **Preencha antes do deploy**: a política de uso do Nominatim exige identificação válida. |
| `NOMINATIM_BASE_URL`     | `https://nominatim.openstreetmap.org`        | Endpoint do geocoder (troque por instância própria).              |
| `OSRM_CAR_URL`           | `https://routing.openstreetmap.de/routed-car`| Instância OSRM do perfil de carro.                                |
| `OSRM_BIKE_URL`          | `https://routing.openstreetmap.de/routed-bike`| Instância OSRM do perfil de bicicleta.                           |
| `OSRM_FOOT_URL`          | `https://routing.openstreetmap.de/routed-foot`| Instância OSRM do perfil a pé.                                   |
| `GEOCODING_LANGUAGE`     | `pt-BR`                                      | Idioma preferencial dos resultados.                               |
| `GEOCODING_PROVIDER`     | `nominatim`                                  | Identificação do provedor ativo.                                  |
| `ROUTING_PROVIDER`       | `osrm`                                       | Identificação do motor de rotas ativo.                            |

Nenhuma dessas variáveis é uma chave de API. **Nunca comite `.env.local`** —
ele já está no `.gitignore`.

---

## Publicando no GitHub

```bash
git checkout -b minha-branch
git add routeflow
git commit -m "feat: RouteFlow, otimizador de rotas com múltiplos endereços"
git push -u origin minha-branch
```

Confira antes de publicar:

- `.env.local` **não** deve aparecer em `git status`;
- `.env.example` contém apenas placeholders;
- `node_modules/` e `.next/` estão ignorados.

---

## Deploy gratuito

### Vercel (recomendado)

1. Importe o repositório em <https://vercel.com/new>.
2. Em **Root Directory**, selecione `routeflow`.
3. Framework: Next.js (detectado automaticamente). Build: `npm run build`.
4. Em **Environment Variables**, defina ao menos `NOMINATIM_CONTACT_EMAIL`.
5. Deploy.

O plano gratuito (Hobby) da Vercel atende ao projeto: as rotas `/api` rodam
como funções serverless e a página é estática.

### Alternativas gratuitas

- **Netlify** com `@netlify/plugin-nextjs`.
- **Cloudflare Pages** com o adaptador do Next.js.
- **Render** / **Railway** rodando `npm run build && npm start`.
- Qualquer VPS ou container com Node 20+.

---

## Limitações dos serviços gratuitos

Estas são as regras dos serviços públicos usados — respeite-as; o projeto
**não** inclui nenhum mecanismo para contorná-las.

**Nominatim** (<https://operations.osmfoundation.org/policies/nominatim/>)

- Máximo de **1 requisição por segundo**. O RouteFlow enfileira as chamadas no
  servidor para cumprir esse limite; sob uso intenso o autocomplete fica mais
  lento em vez de estourar a cota.
- Exige `User-Agent` identificável com contato válido.
- Proibido uso pesado ou automatizado em massa. Para produção com volume,
  hospede sua própria instância ou contrate um provedor (LocationIQ, Geoapify,
  MapTiler têm planos gratuitos com chave).

**OSRM público da FOSSGIS** (<https://routing.openstreetmap.de/>)

- Sem SLA; podem ocorrer indisponibilidades e limites de taxa.
- O serviço `/table` (matriz) é limitado — o RouteFlow trabalha com até **60
  pontos** por cálculo e devolve mensagem clara acima disso.
- Sem perfil de motocicleta (ver observação acima).
- Para produção, rode seu próprio OSRM (Docker) ou use GraphHopper/Valhalla.

**Tiles do OpenStreetMap** (<https://operations.osmfoundation.org/policies/tiles/>)

- Uso pesado é proibido; a atribuição deve permanecer visível (e permanece).
- Para tráfego real, use um provedor de tiles (MapTiler, Stadia, Thunderforest)
  ou hospede os seus.

**Cobertura**: a qualidade da geocodificação e das rotas depende dos dados do
OpenStreetMap na região — em geral excelente em áreas urbanas brasileiras,
irregular em zonas rurais.

---

## Privacidade

- A localização do dispositivo **não é enviada a nenhum servidor de
  persistência**; fica no estado da aplicação e no `localStorage` do próprio
  navegador.
- Coordenadas só saem do navegador para calcular a rota, através das rotas
  `/api` da própria aplicação, que não armazenam nada.
- O link de compartilhamento carrega apenas o que o usuário digitou (endereços
  e coordenadas), codificado na própria URL — não há registro no servidor.

---

## Próximos recursos recomendados

1. **Janelas de atendimento e prioridades** — a estrutura (`StopConstraints`)
   já existe; falta a penalização no algoritmo.
2. **Rota circular (retornar à origem)** — o otimizador já aceita
   `roundTrip`; falta expor o controle na interface.
3. **Múltiplos veículos / entregadores** — particionar destinos entre rotas
   (problema de roteamento de veículos).
4. **Importação em massa** de endereços por CSV ou colagem de lista.
5. **Exportação para navegação** — deep links para OsmAnd, Waze ou Organic Maps
   por parada.
6. **Instância própria de OSRM e Nominatim** em Docker, eliminando os limites
   dos serviços públicos.
7. **PWA offline** com cache de tiles e da última rota.
8. **Contas e histórico** (aí sim PostgreSQL/Supabase), com rotas salvas por
   usuário.
9. **Testes automatizados** no repositório: unitários para os algoritmos e
   end-to-end com Playwright.

---

## Créditos

Dados de mapa © colaboradores do [OpenStreetMap](https://www.openstreetmap.org/copyright).
Geocodificação por [Nominatim](https://nominatim.org/).
Roteamento por [OSRM](https://project-osrm.org/) via [FOSSGIS](https://routing.openstreetmap.de/).
