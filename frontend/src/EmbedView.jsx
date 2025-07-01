// src/EmbedView.jsx  (React mini-app tanpa header/footer)
import React, { useEffect, useState } from 'react';
import { useSearchParams }            from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function EmbedView() {
  const [params] = useSearchParams();
  const id       = params.get('id');
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    (async () => {
      const res  = await fetch(`/api/metadata/${id}`);
      const data = await res.json();
      setMeta(data);
    })();
  }, [id]);

  if (!meta) return <p>Loading…</p>;

  return (
    <div className="card" style={{ width:'100%', border:'none' }}>
      <img src={meta.image} className="card-img-top" alt="" />
      <div className="card-body p-2 text-center">
        <p className="mb-1">{meta.name}</p>
        <a href={`https://your-app.com/view/${id}`} target="_blank" className="btn btn-sm btn-primary">
          View on Bitstamp
        </a>
      </div>
    </div>
  );
}