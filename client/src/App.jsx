import { useState, useEffect, useRef } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { useGLTF, OrbitControls, Environment, Stats, Html } from '@react-three/drei'
import { useControls, button } from 'leva'
import { TextureLoader } from 'three'

// import Models from './models.json'

function Earth() {
  const ref = useRef()
  const { gl } = useThree()
  const texture = useLoader(TextureLoader, 'https://boacinema.com/projects/2024/BruceTest_COLOR.jpg')
  const displacementMap = useLoader(TextureLoader, 'https://boacinema.com/projects/2024/BruceTest_DEPTH.png')
//  const texture = useLoader(TextureLoader, '/img/BruceTest_COLOR.jpg')
//  const displacementMap = useLoader(TextureLoader, '/img/BruceTest_DEPTH.png')

  const material = useControls({
    displacementScale: { value: 0.2, min: 0, max: 1, step: 0.001 },
    wireframe: false
  })

//  useEffect(() => {
//    texture.anisotropy = gl.capabilities.getMaxAnisotropy()
//  }, [texture, gl])
//  useFrame((_, delta) => {
//    ref.current.rotation.y += delta / 4
// })


//  useFrame((_, delta) => {
//    ref.current.rotation.y += delta / 4
//  })

  return (
    <mesh ref={ref}
    castShadow={false}
    receiveShadow={false}
    position={[0, 0, -0.125]}>
      <planeGeometry args={[.4, .225, 384, 216]}/>
      <meshStandardMaterial
        wireframe={material.wireframe}
        map={texture}
        displacementMap={displacementMap}
        displacementScale={material.displacementScale}
      />
    </mesh>
  )
}

/*
function Model({ url }) {
  const { scene } = useGLTF(url)
  const [cache, setCache] = useState({})

  if (!cache[url]) {
    const annotations = []

    scene.traverse((o) => {
      if (o.userData.prop) {
        annotations.push(
          <Html key={o.uuid} position={[o.position.x, o.position.y, o.position.z]} distanceFactor={0.25}>
            <div className="annotation">{o.userData.prop}</div>
          </Html>
        )
      }
    })

    console.log('Caching JSX for url ' + url)
    setCache({
      ...cache,
      [url]: <primitive object={scene}>{annotations}</primitive>
    })
  }
  return cache[url]
} */

export default function App() {
  const [toggle, setToggle] = useState(false);

  const { myNumber } = useControls({
    ThisDoesNothing: {
      value: 4,
      min: 0,
      max: 10,
      step: 1,
    },
  })

  useControls(
    {
      [toggle ? "THIS BUTTON ALSO DOES NOTHING" : "disabled"]: button(() => alert("hello"), {
        disabled: !toggle
      })
    },
    [toggle]
  );

  return (
    <>
      <Canvas camera={{ position: [0, 0, .25], near: 0.025 }}>
        <Environment
          files="https://cdn.jsdelivr.net/gh/Sean-Bradley/React-Three-Fiber-Boilerplate@annotations/public/img/workshop_1k.hdr"
          background
        />
        <Earth/>
        <OrbitControls />
      </Canvas>

      <div className="App">
      </div>
      <span id="info">
      Bruce 3D test.
      </span>

    </>
  )
}

