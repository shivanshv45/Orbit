export interface Subtopic {
  id: string;
  title: string;
  status: 'locked' | 'available' | 'in-progress' | 'completed';
  type: 'lesson' | 'simulation' | 'practice' | 'recall';
  duration?: string;
  description?: string;
}

export interface Topic {
  id: string;
  title: string;
  subtopics: Subtopic[];
  status: 'locked' | 'available' | 'in-progress' | 'completed';
}

export interface Module {
  id: string;
  title: string;
  description: string;
  topics: Topic[];
  progress: number;
  status: 'locked' | 'available' | 'in-progress' | 'completed';
}

export interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  totalProgress: number;
  estimatedTime: string;
}

export const mockCourse: Course = {
  id: 'newton-laws',
  title: "Newton's Laws of Motion",
  description: 'Master the fundamental principles that govern motion and forces in classical mechanics.',
  estimatedTime: '5-7 hours',
  totalProgress: 35,
  modules: [
    {
      id: 'mod-1',
      title: 'Foundations of Motion',
      description: 'Build your understanding of the basic concepts that underpin all mechanics.',
      progress: 100,
      status: 'completed',
      topics: [
        {
          id: 'topic-1-1',
          title: 'Scalars vs Vectors',
          status: 'completed',
          subtopics: [
            { id: 'sub-1-1-1', title: 'What are scalars?', status: 'completed', type: 'lesson', duration: '5 min' },
            { id: 'sub-1-1-2', title: 'Understanding vectors', status: 'completed', type: 'lesson', duration: '7 min' },
            { id: 'sub-1-1-3', title: 'Quick recall', status: 'completed', type: 'recall', duration: '2 min' },
          ],
        },
        {
          id: 'topic-1-2',
          title: 'Reference Frames',
          status: 'completed',
          subtopics: [
            { id: 'sub-1-2-1', title: 'Inertial vs non-inertial frames', status: 'completed', type: 'lesson', duration: '8 min' },
            { id: 'sub-1-2-2', title: 'Relative motion', status: 'completed', type: 'lesson', duration: '6 min' },
            { id: 'sub-1-2-3', title: 'Practice problems', status: 'completed', type: 'practice', duration: '5 min' },
          ],
        },
        {
          id: 'topic-1-3',
          title: 'Inertia & Intuition',
          status: 'completed',
          subtopics: [
            { id: 'sub-1-3-1', title: 'What is inertia?', status: 'completed', type: 'lesson', duration: '6 min' },
            { id: 'sub-1-3-2', title: 'Intuition check', status: 'completed', type: 'recall', duration: '3 min' },
          ],
        },
      ],
    },
    {
      id: 'mod-2',
      title: "Newton's Three Laws",
      description: 'The core principles that describe how objects behave when forces act upon them.',
      progress: 45,
      status: 'in-progress',
      topics: [
        {
          id: 'topic-2-1',
          title: "Newton's First Law",
          status: 'completed',
          subtopics: [
            { id: 'sub-2-1-1', title: 'The law of inertia', status: 'completed', type: 'lesson', duration: '8 min' },
            { id: 'sub-2-1-2', title: 'Objects at rest', status: 'completed', type: 'lesson', duration: '5 min' },
            { id: 'sub-2-1-3', title: 'Objects in motion', status: 'completed', type: 'lesson', duration: '6 min' },
            { id: 'sub-2-1-4', title: 'Concept check', status: 'completed', type: 'practice', duration: '4 min' },
          ],
        },
        {
          id: 'topic-2-2',
          title: "Newton's Second Law",
          status: 'in-progress',
          subtopics: [
            { id: 'sub-2-2-1', title: 'Force equals mass times acceleration', status: 'completed', type: 'lesson', duration: '10 min', description: 'Understand the fundamental relationship F = ma' },
            { id: 'sub-2-2-2', title: 'Interactive simulation', status: 'in-progress', type: 'simulation', duration: '8 min', description: 'Explore how force and mass affect acceleration' },
            { id: 'sub-2-2-3', title: 'Units and dimensions', status: 'available', type: 'lesson', duration: '5 min' },
            { id: 'sub-2-2-4', title: 'Practice problems', status: 'available', type: 'practice', duration: '6 min' },
          ],
        },
        {
          id: 'topic-2-3',
          title: "Newton's Third Law",
          status: 'available',
          subtopics: [
            { id: 'sub-2-3-1', title: 'Action and reaction', status: 'available', type: 'lesson', duration: '8 min' },
            { id: 'sub-2-3-2', title: 'Interactive simulation', status: 'available', type: 'simulation', duration: '8 min' },
            { id: 'sub-2-3-3', title: 'Common misconceptions', status: 'available', type: 'lesson', duration: '6 min' },
            { id: 'sub-2-3-4', title: 'Recall quiz', status: 'available', type: 'recall', duration: '4 min' },
          ],
        },
      ],
    },
    {
      id: 'mod-3',
      title: 'Real-World Applications',
      description: 'Apply Newton\'s laws to solve practical problems and understand everyday phenomena.',
      progress: 0,
      status: 'available',
      topics: [
        {
          id: 'topic-3-1',
          title: 'Free Body Diagrams',
          status: 'available',
          subtopics: [
            { id: 'sub-3-1-1', title: 'Drawing force vectors', status: 'available', type: 'lesson', duration: '10 min' },
            { id: 'sub-3-1-2', title: 'Identifying forces', status: 'available', type: 'lesson', duration: '8 min' },
            { id: 'sub-3-1-3', title: 'Interactive practice', status: 'available', type: 'simulation', duration: '10 min' },
          ],
        },
        {
          id: 'topic-3-2',
          title: 'Friction',
          status: 'available',
          subtopics: [
            { id: 'sub-3-2-1', title: 'Static vs kinetic friction', status: 'available', type: 'lesson', duration: '8 min' },
            { id: 'sub-3-2-2', title: 'Friction simulation', status: 'available', type: 'simulation', duration: '10 min' },
            { id: 'sub-3-2-3', title: 'Coefficient of friction', status: 'available', type: 'lesson', duration: '7 min' },
            { id: 'sub-3-2-4', title: 'Problem solving', status: 'available', type: 'practice', duration: '8 min' },
          ],
        },
        {
          id: 'topic-3-3',
          title: 'Common Misconceptions',
          status: 'available',
          subtopics: [
            { id: 'sub-3-3-1', title: 'Myth busting', status: 'available', type: 'lesson', duration: '10 min' },
            { id: 'sub-3-3-2', title: 'Final assessment', status: 'available', type: 'practice', duration: '15 min' },
          ],
        },
      ],
    },
    {
      id: 'mod-4',
      title: 'Circular Motion & Critical Speed',
      description: 'Understand the physics of circular motion and the minimum speed needed for objects to maintain their path.',
      progress: 0,
      status: 'available',
      topics: [
        {
          id: 'topic-4-1',
          title: 'Circular Motion Basics',
          status: 'available',
          subtopics: [
            { id: 'sub-4-1-1', title: 'What is circular motion?', status: 'available', type: 'lesson', duration: '8 min' },
            { id: 'sub-4-1-2', title: 'Centripetal acceleration', status: 'available', type: 'lesson', duration: '10 min' },
            { id: 'sub-4-1-3', title: 'Centripetal force', status: 'available', type: 'lesson', duration: '8 min' },
            { id: 'sub-4-1-4', title: 'Practice problems', status: 'available', type: 'practice', duration: '6 min' },
          ],
        },
        {
          id: 'topic-4-2',
          title: 'Critical Speed',
          status: 'available',
          subtopics: [
            { id: 'sub-4-2-1', title: 'What is critical speed?', status: 'available', type: 'lesson', duration: '8 min' },
            { id: 'sub-4-2-2', title: 'Critical speed simulation', status: 'available', type: 'simulation', duration: '10 min' },
            { id: 'sub-4-2-3', title: 'Vertical loops explained', status: 'available', type: 'lesson', duration: '8 min' },
            { id: 'sub-4-2-4', title: 'Roller coaster physics', status: 'available', type: 'lesson', duration: '7 min' },
            { id: 'sub-4-2-5', title: 'Practice problems', status: 'available', type: 'practice', duration: '8 min' },
          ],
        },
        {
          id: 'topic-4-3',
          title: 'Banking & Turns',
          status: 'available',
          subtopics: [
            { id: 'sub-4-3-1', title: 'Banked curves', status: 'available', type: 'lesson', duration: '10 min' },
            { id: 'sub-4-3-2', title: 'Car on a curve', status: 'available', type: 'lesson', duration: '8 min' },
            { id: 'sub-4-3-3', title: 'Final assessment', status: 'available', type: 'practice', duration: '12 min' },
          ],
        },
      ],
    },
  ],
};

export const lessonContent: Record<string, {
  title: string;
  sections: Array<{
    type: 'text' | 'equation' | 'insight' | 'list' | 'diagram' | 'simulation';
    content?: string;
    label?: string;
    items?: string[];
    alt?: string;
    id?: string;
  }>;
}> = {
  'sub-1-1-1': {
    title: 'What are Scalars?',
    sections: [
      {
        type: 'text',
        content: 'In physics, we use two types of quantities to describe the world: scalars and vectors. Let\'s start with the simpler one - scalars.',
      },
      {
        type: 'text',
        content: 'A scalar is a quantity that has only magnitude (size or amount). It\'s just a number with a unit.',
      },
      {
        type: 'insight',
        content: 'Think of scalars as answers to "how much?" questions. Temperature, mass, time, speed - these are all scalars.',
      },
      {
        type: 'list',
        items: [
          'Temperature: 25°C (just a number)',
          'Mass: 5 kg (no direction needed)',
          'Time: 3 seconds (direction doesn\'t apply)',
          'Speed: 60 km/h (tells you how fast, not where)',
          'Energy: 100 Joules',
        ],
      },
      {
        type: 'text',
        content: 'When you combine scalars, you use regular arithmetic. 5 kg + 3 kg = 8 kg. Simple!',
      },
    ],
  },
  'sub-1-1-2': {
    title: 'Understanding Vectors',
    sections: [
      {
        type: 'text',
        content: 'Vectors are quantities that have both magnitude AND direction. This distinction is crucial in physics.',
      },
      {
        type: 'insight',
        content: 'Velocity is a vector (speed + direction). "60 km/h north" is different from "60 km/h south" even though the speed is the same!',
      },
      {
        type: 'list',
        items: [
          'Velocity: 60 km/h north (speed + direction)',
          'Force: 10 N to the right',
          'Displacement: 5 meters east',
          'Acceleration: 9.8 m/s² downward (gravity)',
        ],
      },
      {
        type: 'text',
        content: 'Vector addition is more complex. Two forces of 3 N and 4 N don\'t always add to 7 N - it depends on their directions!',
      },
      {
        type: 'equation',
        content: 'If perpendicular: |R| = √(3² + 4²) = 5 N',
        label: 'Pythagorean theorem for perpendicular vectors',
      },
    ],
  },
  'sub-1-2-1': {
    title: 'Inertial vs Non-Inertial Frames',
    sections: [
      {
        type: 'text',
        content: 'A reference frame is like a viewpoint from which you observe motion. Different frames can see the same event differently.',
      },
      {
        type: 'insight',
        content: 'Standing on the ground and riding a train are two different reference frames. Motion that looks simple from one can look complex from another!',
      },
      {
        type: 'text',
        content: 'An inertial frame is one that is not accelerating. Newton\'s laws work simply in inertial frames.',
      },
      {
        type: 'list',
        items: [
          'Inertial: Standing on ground (approximately)',
          'Inertial: Moving at constant velocity in a train',
          'Non-inertial: Inside an accelerating car',
          'Non-inertial: On a spinning merry-go-round',
        ],
      },
      {
        type: 'text',
        content: 'In non-inertial frames, you feel "fictitious forces" like being pushed back when a car accelerates forward.',
      },
    ],
  },
  'sub-1-2-2': {
    title: 'Relative Motion',
    sections: [
      {
        type: 'text',
        content: 'Motion is always relative - it depends on what you\'re measuring it against. There\'s no absolute "still" in physics.',
      },
      {
        type: 'equation',
        content: 'v(A relative to C) = v(A relative to B) + v(B relative to C)',
        label: 'Relative velocity addition',
      },
      {
        type: 'insight',
        content: 'If you\'re on a train moving at 100 km/h and walk forward at 5 km/h, someone on the ground sees you moving at 105 km/h!',
      },
      {
        type: 'text',
        content: 'This principle is essential for understanding many real-world situations: planes in wind, boats in currents, and even planetary motion.',
      },
    ],
  },
  'sub-1-3-1': {
    title: 'What is Inertia?',
    sections: [
      {
        type: 'text',
        content: 'Inertia is the tendency of an object to resist changes to its state of motion. It\'s not a force - it\'s a property of matter.',
      },
      {
        type: 'insight',
        content: 'Mass is the measure of inertia. More mass = more inertia = harder to start moving OR harder to stop.',
      },
      {
        type: 'text',
        content: 'A bowling ball has more inertia than a tennis ball. That\'s why it\'s harder to throw, but also harder to catch once it\'s moving!',
      },
      {
        type: 'list',
        items: [
          'A heavy truck takes longer to speed up than a bicycle',
          'It also takes longer to stop',
          'Objects in space keep moving forever (no friction!)',
          'Your body lurches forward when a car stops suddenly',
        ],
      },
    ],
  },
  'sub-2-1-1': {
    title: 'The Law of Inertia',
    sections: [
      {
        type: 'text',
        content: 'Newton\'s First Law states: An object at rest stays at rest, and an object in motion stays in motion with the same speed and direction, unless acted upon by an unbalanced force.',
      },
      {
        type: 'insight',
        content: 'This was revolutionary! Before Newton, people thought objects naturally slowed down. Newton realized that slowing down requires a force (friction).',
      },
      {
        type: 'text',
        content: 'In the absence of forces, an object\'s velocity never changes. This includes both its speed AND direction.',
      },
      {
        type: 'list',
        items: [
          'A hockey puck slides far on ice (little friction)',
          'Spacecraft don\'t need engines to keep moving',
          'You need a seatbelt because your body has inertia',
        ],
      },
    ],
  },
  'sub-2-1-2': {
    title: 'Objects at Rest',
    sections: [
      {
        type: 'text',
        content: 'When an object is at rest, it takes an unbalanced force to make it move. The larger the mass, the more force is needed.',
      },
      {
        type: 'insight',
        content: 'A book on a table stays there forever unless something pushes it. Gravity pulls down, but the table pushes up equally - the forces are balanced!',
      },
      {
        type: 'text',
        content: 'Common examples of objects at rest requiring force to move include pushing furniture, starting a car from standstill, and kicking a soccer ball.',
      },
    ],
  },
  'sub-2-1-3': {
    title: 'Objects in Motion',
    sections: [
      {
        type: 'text',
        content: 'Once moving, objects want to keep moving at constant velocity. Any change in speed or direction requires a force.',
      },
      {
        type: 'text',
        content: 'This is why passengers lurch forward when a bus stops suddenly - their bodies want to keep moving at the bus\'s original speed.',
      },
      {
        type: 'insight',
        content: 'In outer space, with no friction or air resistance, a spacecraft will coast forever without using any fuel!',
      },
    ],
  },
  'sub-2-2-1': {
    title: 'Force equals mass times acceleration',
    sections: [
      {
        type: 'text',
        content: "Newton's Second Law is perhaps the most important equation in classical mechanics. It tells us exactly how objects respond to forces.",
      },
      {
        type: 'equation',
        content: 'F = m × a',
        label: "Newton's Second Law",
      },
      {
        type: 'text',
        content: 'This elegant equation connects three fundamental quantities: Force (F), measured in Newtons; Mass (m), measured in kilograms; and Acceleration (a), measured in meters per second squared.',
      },
      {
        type: 'insight',
        content: 'Think of mass as "resistance to acceleration." The more massive an object, the more force you need to accelerate it by the same amount.',
      },
      {
        type: 'text',
        content: "Let's break this down with a simple example. Imagine pushing a shopping cart versus pushing a car. Even if you push with the same force, the cart accelerates much more because it has less mass.",
      },
      {
        type: 'diagram',
        alt: 'Force and mass relationship diagram',
      },
      {
        type: 'text',
        content: 'We can rearrange this equation to solve for any of the three variables:',
      },
      {
        type: 'list',
        items: [
          'To find force: F = m × a',
          'To find acceleration: a = F / m',
          'To find mass: m = F / a',
        ],
      },
    ],
  },
  'sub-2-2-2': {
    title: 'Interactive Simulation',
    sections: [
      {
        type: 'text',
        content: "Now let's explore Newton's Second Law through an interactive simulation. You'll control the force and mass to see how they affect acceleration in real-time.",
      },
      {
        type: 'simulation',
        id: 'newton-second-law',
      },
      {
        type: 'insight',
        content: 'Try doubling the force while keeping mass constant. What happens to acceleration? Now try doubling the mass instead. Notice the inverse relationship!',
      },
    ],
  },
  'sub-2-2-3': {
    title: 'Units and Dimensions',
    sections: [
      {
        type: 'text',
        content: 'Understanding units is crucial for solving physics problems correctly. Let\'s examine the units in F = ma.',
      },
      {
        type: 'equation',
        content: '1 Newton = 1 kg × 1 m/s²',
        label: 'Definition of the Newton',
      },
      {
        type: 'text',
        content: 'A Newton is the force required to accelerate a 1 kg mass at 1 m/s². This is roughly the weight of a small apple!',
      },
      {
        type: 'insight',
        content: 'Always check your units! If your answer has the wrong units, something went wrong in your calculation.',
      },
      {
        type: 'list',
        items: [
          'Force is measured in Newtons (N) = kg·m/s²',
          'Mass is measured in kilograms (kg)',
          'Acceleration is measured in m/s²',
          'Weight (a force) = mass × gravity = mg',
        ],
      },
    ],
  },
  'sub-2-3-1': {
    title: 'Action and Reaction',
    sections: [
      {
        type: 'text',
        content: 'Newton\'s Third Law states: For every action, there is an equal and opposite reaction. This means forces always come in pairs.',
      },
      {
        type: 'insight',
        content: 'When you push on a wall, the wall pushes back on you with equal force. That\'s why you don\'t go through it!',
      },
      {
        type: 'text',
        content: 'The key point is that these forces act on DIFFERENT objects. When you push a cart, you push on the cart and the cart pushes on you.',
      },
      {
        type: 'list',
        items: [
          'You push Earth down, Earth pushes you up (that\'s how you stand!)',
          'Rocket pushes exhaust down, exhaust pushes rocket up',
          'Swimmer pushes water back, water pushes swimmer forward',
          'Car tire pushes road back, road pushes car forward',
        ],
      },
      {
        type: 'equation',
        content: 'F(A on B) = -F(B on A)',
        label: 'Newton\'s Third Law in equation form',
      },
    ],
  },
  'sub-2-3-2': {
    title: 'Third Law Simulation',
    sections: [
      {
        type: 'text',
        content: 'Watch how action-reaction pairs work when two objects interact. The forces are always equal, but the accelerations depend on mass!',
      },
      {
        type: 'simulation',
        id: 'newton-third-law',
      },
      {
        type: 'insight',
        content: 'Notice that the lighter object accelerates more than the heavier one, even though they experience the same force. This is F = ma in action!',
      },
    ],
  },
  'sub-2-3-3': {
    title: 'Common Misconceptions',
    sections: [
      {
        type: 'text',
        content: 'Newton\'s Third Law is often misunderstood. Let\'s clear up some common misconceptions.',
      },
      {
        type: 'insight',
        content: 'Misconception: "If forces are equal and opposite, they should cancel out." Wrong! They act on different objects, so they can\'t cancel.',
      },
      {
        type: 'list',
        items: [
          'Action-reaction pairs NEVER cancel (different objects)',
          'A horse CAN pull a cart (friction on ground provides net force)',
          'You CAN push yourself up from a chair (chair pushes back)',
          'Equal forces don\'t mean equal motion (depends on mass)',
        ],
      },
      {
        type: 'text',
        content: 'The horse-cart problem: The horse pushes ground backward, ground pushes horse forward. This forward force on the horse-cart system exceeds friction, so they move!',
      },
    ],
  },
  'sub-3-1-1': {
    title: 'Drawing Force Vectors',
    sections: [
      {
        type: 'text',
        content: 'Free body diagrams are essential tools for solving force problems. They show all forces acting on a single object.',
      },
      {
        type: 'insight',
        content: 'The key is to draw ONLY forces acting ON the object, not forces the object exerts on others!',
      },
      {
        type: 'list',
        items: [
          'Draw the object as a simple shape (box or dot)',
          'Identify all forces: gravity, normal, friction, tension, applied',
          'Draw arrows FROM the object in the direction of each force',
          'Make arrow length proportional to force magnitude',
          'Label each force clearly',
        ],
      },
    ],
  },
  'sub-3-2-1': {
    title: 'Static vs Kinetic Friction',
    sections: [
      {
        type: 'text',
        content: 'Friction opposes motion between surfaces in contact. There are two types: static (not moving) and kinetic (moving).',
      },
      {
        type: 'insight',
        content: 'Static friction is stronger than kinetic friction. That\'s why it\'s harder to START pushing a heavy box than to KEEP it moving!',
      },
      {
        type: 'equation',
        content: 'f ≤ μₛN (static) | f = μₖN (kinetic)',
        label: 'Friction equations',
      },
      {
        type: 'text',
        content: 'Static friction adjusts to match applied force (up to a maximum). Kinetic friction is constant once motion begins.',
      },
    ],
  },
  'sub-3-2-2': {
    title: 'Friction Simulation',
    sections: [
      {
        type: 'text',
        content: 'Explore how friction affects motion. See the difference between static and kinetic friction and learn what happens when you overcome the static friction threshold.',
      },
      {
        type: 'simulation',
        id: 'friction-sim',
      },
      {
        type: 'insight',
        content: 'Try setting the applied force just below the static friction threshold. The object won\'t move! Now increase it slightly above - motion begins.',
      },
    ],
  },
  'sub-4-1-1': {
    title: 'What is Circular Motion?',
    sections: [
      {
        type: 'text',
        content: 'Circular motion occurs when an object moves along a circular path. Even at constant speed, the object is accelerating because its direction is constantly changing.',
      },
      {
        type: 'insight',
        content: 'Speed can be constant, but velocity cannot be constant in circular motion. Remember: velocity includes direction!',
      },
      {
        type: 'text',
        content: 'Examples of circular motion include planets orbiting the sun, a car going around a curve, a ball on a string being swung in a circle, and electrons orbiting an atom.',
      },
    ],
  },
  'sub-4-1-2': {
    title: 'Centripetal Acceleration',
    sections: [
      {
        type: 'text',
        content: 'Any object in circular motion experiences centripetal acceleration - acceleration directed toward the center of the circle.',
      },
      {
        type: 'equation',
        content: 'a = v²/r',
        label: 'Centripetal acceleration formula',
      },
      {
        type: 'insight',
        content: '"Centripetal" means "center-seeking." The acceleration always points toward the center, which is why the object curves instead of going straight.',
      },
      {
        type: 'list',
        items: [
          'Faster speed = more acceleration (squared relationship!)',
          'Smaller radius = more acceleration',
          'Direction: always toward the center',
          'This acceleration requires a force (centripetal force)',
        ],
      },
    ],
  },
  'sub-4-1-3': {
    title: 'Centripetal Force',
    sections: [
      {
        type: 'text',
        content: 'By Newton\'s Second Law, centripetal acceleration requires a centripetal force. This force is provided by tension, gravity, friction, or other real forces.',
      },
      {
        type: 'equation',
        content: 'F = mv²/r',
        label: 'Centripetal force formula',
      },
      {
        type: 'insight',
        content: 'Centripetal force is NOT a new type of force! It\'s just a name for whatever force is causing the circular motion.',
      },
      {
        type: 'list',
        items: [
          'Ball on string: tension provides centripetal force',
          'Car on curve: friction provides centripetal force',
          'Planet orbiting: gravity provides centripetal force',
          'Banked track: normal force component provides it',
        ],
      },
    ],
  },
  'sub-4-2-1': {
    title: 'What is Critical Speed?',
    sections: [
      {
        type: 'text',
        content: 'Critical speed is the minimum speed needed for an object to maintain contact with a circular track, especially at the top of a vertical loop.',
      },
      {
        type: 'text',
        content: 'At the top of a vertical loop, gravity pulls downward. For the object to stay on the track, gravity must provide at least the necessary centripetal force.',
      },
      {
        type: 'equation',
        content: 'v(critical) = √(gr)',
        label: 'Critical speed at top of loop',
      },
      {
        type: 'insight',
        content: 'If you go slower than critical speed at the top, you\'ll fall! This is why roller coasters are designed to ensure you always exceed critical speed.',
      },
    ],
  },
  'sub-4-2-2': {
    title: 'Critical Speed Simulation',
    sections: [
      {
        type: 'text',
        content: 'Experiment with a vertical loop and discover the critical speed needed to complete it. See what happens when you go too slow!',
      },
      {
        type: 'simulation',
        id: 'critical-speed',
      },
      {
        type: 'insight',
        content: 'Try speeds above and below the critical threshold. Notice how the critical speed changes with loop radius - larger loops need more speed!',
      },
    ],
  },
  'sub-4-2-3': {
    title: 'Vertical Loops Explained',
    sections: [
      {
        type: 'text',
        content: 'In a vertical loop, the forces change as you go around. At the bottom, normal force and gravity oppose. At the top, they point the same direction.',
      },
      {
        type: 'text',
        content: 'At the bottom of the loop: N - mg = mv²/r, so N = mg + mv²/r. You feel heavier!',
      },
      {
        type: 'text',
        content: 'At the top of the loop: N + mg = mv²/r, so N = mv²/r - mg. You feel lighter (or weightless at critical speed)!',
      },
      {
        type: 'insight',
        content: 'At exactly critical speed, the normal force at the top is zero - you\'re in free fall but still on the track! Any slower and you fall.',
      },
    ],
  },
  'sub-4-2-4': {
    title: 'Roller Coaster Physics',
    sections: [
      {
        type: 'text',
        content: 'Roller coasters are masterful applications of physics. They use gravity, energy conservation, and careful design to create thrilling but safe rides.',
      },
      {
        type: 'insight',
        content: 'Roller coaster loops are usually teardrop-shaped, not circular. This keeps forces more consistent and reduces the G-forces on riders.',
      },
      {
        type: 'list',
        items: [
          'Initial hill provides gravitational potential energy',
          'Energy converts between potential and kinetic',
          'Loops are designed to always exceed critical speed',
          'Clothoid (teardrop) shapes reduce G-forces',
          'Friction and air resistance require hills to get lower each time',
        ],
      },
    ],
  },
};

export const practiceQuestions: Array<{
  id: string;
  type: 'conceptual' | 'numerical' | 'misconception';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}> = [
    {
      id: 'q1',
      type: 'conceptual',
      question: 'If you apply a constant force to an object, what happens to its velocity over time?',
      options: [
        'It stays constant',
        'It increases at a constant rate',
        'It decreases',
        'It oscillates',
      ],
      correctAnswer: 1,
      explanation: 'A constant force produces constant acceleration, which means velocity increases at a steady rate.',
    },
    {
      id: 'q2',
      type: 'numerical',
      question: 'A 5 kg object experiences a net force of 20 N. What is its acceleration?',
      options: ['2 m/s²', '4 m/s²', '25 m/s²', '100 m/s²'],
      correctAnswer: 1,
      explanation: 'Using F = ma, we get a = F/m = 20/5 = 4 m/s².',
    },
    {
      id: 'q3',
      type: 'misconception',
      question: 'An object is moving at constant velocity. What can you conclude about the net force?',
      options: [
        'There must be a force in the direction of motion',
        'The net force must be zero',
        'The object must be very light',
        'Friction must be absent',
      ],
      correctAnswer: 1,
      explanation: 'Constant velocity means zero acceleration. By F = ma, if a = 0, then F = 0. The net force is zero.',
    },
    {
      id: 'q4',
      type: 'conceptual',
      question: 'Why does a heavier object require more force to push than a lighter one?',
      options: [
        'Gravity is stronger on heavier objects',
        'Heavier objects have more inertia',
        'Heavier objects create more friction',
        'Heavier objects are larger',
      ],
      correctAnswer: 1,
      explanation: 'Mass is a measure of inertia - resistance to acceleration. By F = ma, more mass means more force is needed for the same acceleration.',
    },
    {
      id: 'q5',
      type: 'numerical',
      question: 'What is the minimum speed needed to complete a vertical loop of radius 4 meters?',
      options: ['6.3 m/s', '9.8 m/s', '4.0 m/s', '39.2 m/s'],
      correctAnswer: 0,
      explanation: 'Critical speed v = √(gr) = √(9.8 × 4) = √39.2 ≈ 6.3 m/s.',
    },
  ];
