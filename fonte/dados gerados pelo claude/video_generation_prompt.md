# Descrição de Cena para IA de Geração de Vídeo (Sora/Runway/Kling/Luma)

Esta documentação fornece os detalhes exatos para gerar um vídeo pré-renderizado que se encaixe perfeitamente na estética e no fluxo do jogo "Batalha do Estreito 2.0".

---

## 1. Visão Geral
- **Duração do Vídeo:** Exatamente 8 segundos.
- **Perspectiva da Câmera:** Primeira pessoa (FPS) ou visão imersiva na altura dos olhos a partir do convés de um navio de guerra. A câmera aponta ligeiramente para cima (em direção ao céu) no início e acompanha a descida de um drone até o impacto.
- **Ritmo:** Frenético e desesperador. Começa com tiros tensos e termina com uma explosão avassaladora que encobre a câmera.

## 2. Cenário, Iluminação e Atmosfera
- **Horário:** Pôr do sol ("Golden Hour").
- **Iluminação:** Luz solar vibrante alaranjada e intensa vinda do horizonte. Sombras longas e duras projetadas no convés do navio.
- **Céu:** Gradiente perfeito indo de um azul profundo no topo para um laranja muito forte perto da linha da água. Poucas nuvens translúcidas e esparsas.
- **Atmosfera:** Tensa, com fumaça no ar de disparos anteriores.

## 3. Elementos em Cena
### A Embarcação e a Tripulação
- **O Navio:** Convés metálico cinza-escuro de um contratorpedeiro moderno/WW2 misto. Chão com texturas ásperas de metal.
- **Os Tripulantes:** 8 marinheiros espalhados pelo convés e superestrutura. Vestem uniformes navais escuros (azul marinho) e quepes.
- **Ação dos Tripulantes:** Estão em pânico controlado. Todos estão com armas em punho (fuzis e metralhadoras) apontando para cima, atirando desesperadamente contra um alvo no céu. Na perspectiva em primeira pessoa, vemos as mãos e a metralhadora pesada (minigun) do próprio espectador disparando intensamente na parte inferior da tela.

### O Drone (A Ameaça)
- **Modelo:** Drone militar estilo *Shahed-136* (asa delta, formato triangular, cor cinza fosco).
- **Trajetória:** Começa como um ponto no céu distante e mergulha em uma linha diagonal agressiva e constante diretamente em direção à câmera.

## 4. Efeitos Visuais (VFX)
- **Fogo Antiaéreo (Flak):** O céu está repleto de explosões aéreas (tufos de fumaça preta espessa com rápidos flashes laranjas no centro).
- **Tiros Traçantes (Tracers):** Inúmeras linhas de luz (traçantes amarelo-alaranjados ou ciano) rasgando o céu a partir do navio em direção ao drone.
- **Muzzle Flashes:** Clarões fortes e faíscas saindo das armas dos marinheiros e da minigun na perspectiva da câmera.
- **O Impacto Final (Segundos 7 a 8):** O drone atinge o convés diretamente na frente da câmera. Uma explosão massiva de fogo laranja e destroços engole a tela completamente na transição para o segundo final, ideal para um "fade to black" ou corte seco.

---

## 5. Prompts Prontos (Em Inglês para IAs de Vídeo)

As IAs de vídeo (como Midjourney para base e Runway Gen-2/Sora para animação) funcionam melhor em inglês. Aqui estão prompts otimizados:

### Prompt Principal (Geração de Vídeo Direta)
> **Prompt:** First-person POV from the deck of a metallic warship during a vibrant golden hour sunset. The camera looks up at a gray delta-wing military drone diving aggressively straight towards the viewer. Around the camera, 8 navy sailors in dark blue uniforms are frantically shooting assault rifles into the sky. In the foreground, the viewer's hands are firing a heavy minigun, emitting bright muzzle flashes and sparks. The sky is filled with WW2-style black flak explosions and glowing tracer rounds flying upwards. The drone flies through the anti-aircraft fire and crashes directly into the camera at the very end, ending in a massive fiery explosion that engulfs the screen. Cinematic, hyper-realistic, highly detailed, shaky cam, intense action, 8 seconds duration.

### Prompt de Movimento (Camera Motion Instructions)
> **Camera Movement:** Static position but with intense handheld shake that increases in violence as the drone gets closer. The pitch tilts slightly down as the drone approaches the deck. Ends with an explosive jolt.
