const plants = [
  {
    id: 1,
    name: "Correa 'Dusky Bells'",
    origin: 'Native – Victoria',
    photo: 'https://placehold.co/64x64/6b8f3f/ffffff?text=CD',
    dimensions: '0.5m H x 1.5m W',
    sun: 'Part Shade',
    water: 'Low',
    description:
      "A low, spreading groundcover with dusky-pink bell flowers through autumn and winter. Tolerates Melbourne's clay soils and light frost, and is a magnet for nectar-feeding birds.",
    reviews: [
      { id: 1, user: 'Priya N.', rating: 5, date: '2025-06-02', comment: 'Thriving under our gum tree where nothing else would grow. Flowers all winter.' },
      { id: 2, user: 'Tom B.', rating: 4, date: '2025-03-18', comment: 'Handled a rough frost in the Dandenongs without any damage. Slow to establish though.' },
      { id: 3, user: 'Sarah K.', rating: 4, date: '2024-11-05', comment: 'Great border plant, keeps its shape without much pruning.' },
    ],
  },
  {
    id: 2,
    name: 'Lomandra longifolia',
    origin: 'Native – Victoria',
    photo: 'https://placehold.co/64x64/4c7a3a/ffffff?text=LL',
    dimensions: '1m H x 1m W',
    sun: 'Full Sun',
    water: 'Low',
    description:
      'Tough, strappy-leaved tussock used widely in Victorian streetscapes and rain gardens. Copes with drought, poor drainage and heavy foot traffic once established.',
    reviews: [
      { id: 1, user: 'Marco D.', rating: 5, date: '2025-07-14', comment: 'Bulletproof. Survived a whole summer with almost no watering.' },
      { id: 2, user: 'Helen W.', rating: 5, date: '2025-05-01', comment: 'Used it along our driveway, looks neat year-round.' },
      { id: 3, user: 'Aaron P.', rating: 4, date: '2024-09-22', comment: 'Great texture plant, just trim the old flower spikes back.' },
    ],
  },
  {
    id: 3,
    name: "Grevillea 'Poorinda Royal Mantle'",
    origin: 'Native – Australia (NSW/VIC hybrid)',
    photo: 'https://placehold.co/64x64/b3402c/ffffff?text=GR',
    dimensions: '0.5m H x 3m W',
    sun: 'Full Sun',
    water: 'Low',
    description:
      'A vigorous prostrate grevillea that cascades over walls and banks, covered in red spider-flowers most of the year. Excellent for attracting honeyeaters.',
    reviews: [
      { id: 1, user: 'Liam F.', rating: 4, date: '2025-04-09', comment: 'Spilling beautifully over our retaining wall after one season.' },
      { id: 2, user: 'Grace T.', rating: 3, date: '2025-01-27', comment: 'Good grower but needed a hard prune after year two to stay tidy.' },
      { id: 3, user: 'Ben O.', rating: 5, date: '2024-10-11', comment: 'Wattlebirds visit every morning. Couldn\'t be happier.' },
    ],
  },
  {
    id: 4,
    name: 'Westringia fruticosa',
    origin: 'Native – NSW/Victoria coast',
    photo: 'https://placehold.co/64x64/7a8f6e/ffffff?text=WF',
    dimensions: '1.5m H x 1.5m W',
    sun: 'Full Sun',
    water: 'Low',
    description:
      'Coast rosemary forms a dense, salt- and wind-tolerant hedge with small mauve flowers. A reliable low-maintenance screening plant for exposed Victorian coastal gardens.',
    reviews: [
      { id: 1, user: 'Chris L.', rating: 4, date: '2025-06-20', comment: 'Clips into a hedge really well, tough near the beach at Torquay.' },
      { id: 2, user: 'Nadia S.', rating: 4, date: '2025-02-14', comment: 'Handles our westerly winds without complaint.' },
    ],
  },
  {
    id: 5,
    name: 'Banksia spinulosa',
    origin: 'Native – NSW/Victoria',
    photo: 'https://placehold.co/64x64/d9a441/ffffff?text=BS',
    dimensions: '2m H x 2m W',
    sun: 'Full Sun',
    water: 'Low',
    description:
      'Hairpin banksia produces striking gold-and-black flower spikes from autumn to winter, providing food for birds when little else is flowering. Prefers well-drained soil.',
    reviews: [
      { id: 1, user: 'Fiona R.', rating: 5, date: '2025-05-30', comment: 'The flower spikes are stunning and last for weeks as cut flowers too.' },
      { id: 2, user: 'Daniel V.', rating: 5, date: '2025-03-02', comment: 'Rosellas love it. Easy to grow once established.' },
      { id: 3, user: 'Emily H.', rating: 4, date: '2024-08-19', comment: 'Needed better drainage than I first gave it, but recovered fine.' },
    ],
  },
  {
    id: 6,
    name: "Acacia cognata 'Limelight'",
    origin: 'Native – Victoria',
    photo: 'https://placehold.co/64x64/8bb33a/ffffff?text=AC',
    dimensions: '1m H x 1.5m W',
    sun: 'Full Sun',
    water: 'Medium',
    description:
      'A weeping, fine-leaved wattle cultivar bred from the Victorian River Wattle. Bright lime foliage softens garden beds and works well as a feature or informal border.',
    reviews: [
      { id: 1, user: 'Josh M.', rating: 4, date: '2025-07-01', comment: 'Fast growing, gives instant softness to a new garden bed.' },
      { id: 2, user: 'Renee C.', rating: 3, date: '2025-01-11', comment: 'Lovely colour but dropped a lot of leaf litter over summer.' },
    ],
  },
  {
    id: 7,
    name: 'Dianella revoluta',
    origin: 'Native – Victoria',
    photo: 'https://placehold.co/64x64/3a5f8f/ffffff?text=DR',
    dimensions: '0.5m H x 0.5m W',
    sun: 'Part Shade',
    water: 'Low',
    description:
      'Black-anther flax lily is a hardy strappy groundcover with small blue flowers followed by deep purple berries. Useful as underplanting beneath eucalypts.',
    reviews: [
      { id: 1, user: 'Ivy A.', rating: 4, date: '2025-04-27', comment: 'Great filler under our established gums where it is dry and shady.' },
      { id: 2, user: 'Sam G.', rating: 4, date: '2024-12-08', comment: 'Low fuss, the berries bring in silvereyes.' },
    ],
  },
  {
    id: 8,
    name: 'Melaleuca armillaris',
    origin: 'Native – Victoria',
    photo: 'https://placehold.co/64x64/5a7a5a/ffffff?text=MA',
    dimensions: '4m H x 3m W',
    sun: 'Full Sun',
    water: 'Medium',
    description:
      'Bracelet honey myrtle is a fast-growing large shrub or small tree, ideal as a windbreak or screening hedge. Produces masses of cream bottlebrush flowers in summer.',
    reviews: [
      { id: 1, user: 'Wayne K.', rating: 3, date: '2025-02-25', comment: 'Grew quickly as a windbreak but needs regular trimming to stay dense.' },
      { id: 2, user: 'Louise P.', rating: 3, date: '2024-10-30', comment: 'Good screening plant, a bit messy when it drops flowers.' },
    ],
  },
  {
    id: 9,
    name: 'Prostanthera rotundifolia',
    origin: 'Native – Victoria',
    photo: 'https://placehold.co/64x64/8f5a9e/ffffff?text=PR',
    dimensions: '2m H x 2m W',
    sun: 'Part Shade',
    water: 'Medium',
    description:
      'Round-leaf mint bush is smothered in mauve flowers each spring and releases a minty fragrance when brushed. Prefers a sheltered position with good drainage.',
    reviews: [
      { id: 1, user: 'Nicole B.', rating: 5, date: '2025-09-02', comment: 'The spring flower show is incredible, whole plant turns purple.' },
      { id: 2, user: 'Adrian T.', rating: 4, date: '2025-04-15', comment: 'Fragrant and pretty, lost a few branches in a heavy frost though.' },
      { id: 3, user: 'Kate J.', rating: 3, date: '2024-11-20', comment: 'Needed a sheltered spot away from direct afternoon sun to thrive.' },
    ],
  },
  {
    id: 10,
    name: 'Hardenbergia violacea',
    origin: 'Native – Victoria',
    photo: 'https://placehold.co/64x64/6a4c93/ffffff?text=HV',
    dimensions: '2m H x 1m W (climber)',
    sun: 'Part Shade',
    water: 'Low',
    description:
      'Purple coral pea is a fast-growing native climber covered in pea-shaped purple flowers in late winter and spring. Ideal for fences, trellises and covering unsightly structures.',
    reviews: [
      { id: 1, user: 'Oliver S.', rating: 5, date: '2025-08-10', comment: 'Covered our whole fence in one season, and the winter flowers are gorgeous.' },
      { id: 2, user: 'Amelia R.', rating: 5, date: '2025-06-05', comment: 'Bees love it, very low maintenance once it gets going.' },
    ],
  },
  {
    id: 11,
    name: "Anigozanthos 'Bush Gold'",
    origin: 'Native – Western Australia',
    photo: 'https://placehold.co/64x64/d4a017/ffffff?text=AB',
    dimensions: '0.8m H x 0.6m W',
    sun: 'Full Sun',
    water: 'Low',
    description:
      "Kangaroo paw with tall golden-yellow flower stems that attract nectar-feeding birds. Grows well in Victoria in a well-drained, sunny spot away from heavy winter dampness.",
    reviews: [
      { id: 1, user: 'Zoe M.', rating: 4, date: '2025-05-19', comment: 'Great colour, but I had to improve drainage to stop root rot over winter.' },
      { id: 2, user: 'Callum D.', rating: 4, date: '2025-01-08', comment: 'Flowers for months in summer, birds visit constantly.' },
      { id: 3, user: 'Ruby E.', rating: 3, date: '2024-09-14', comment: 'Struggled a bit in our heavier soil until I planted it on a mound.' },
    ],
  },
  {
    id: 12,
    name: 'Correa alba',
    origin: 'Native – Victoria coast',
    photo: 'https://placehold.co/64x64/9fa88f/ffffff?text=CA',
    dimensions: '1m H x 1.5m W',
    sun: 'Part Shade',
    water: 'Low',
    description:
      'White correa is a hardy coastal shrub with small white star-shaped flowers most of the year. Very tolerant of salt spray, wind and poor sandy soils.',
    reviews: [
      { id: 1, user: 'Hannah L.', rating: 4, date: '2025-07-22', comment: 'Perfect for our exposed coastal block near Barwon Heads.' },
      { id: 2, user: 'Patrick Y.', rating: 4, date: '2025-03-30', comment: 'Flowers nearly year-round, very low maintenance.' },
    ],
  },
]

export const PlantService = {
  getPlants() {
    return Promise.resolve(structuredClone(plants))
  },
}
